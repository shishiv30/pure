#!/usr/bin/env bash
#
# Setup ECS Fargate + EFS for Pure CMS so the database persists across service updates.
# Run from repo root: ./cms/scripts/aws/setup-ecs-efs.sh
#
# Optional env vars (defaults shown):
#   AWS_ACCOUNT_ID    - Your AWS account ID (default: 178912016721)
#   SESSION_SECRET    - Secret for signing CMS login cookies. If unset, a random one is generated.
#   AWS_REGION        - Region (default: us-east-1)
#   ECR_REPOSITORY    - ECR repo name (default: pure-cms)
#   VPC_ID            - VPC to use (default: default VPC)
#   SUBNET_IDS        - Comma-separated subnet IDs for ECS/EFS (default: all subnets in VPC)
#   CORS_ORIGINS      - Comma-separated origins (default: https://cms.conjee.com)
#
# After running:
#   - EFS holds the SQLite DB at root; same volume is attached on every new task.
#   - Updating the service (new image) keeps the same EFS mount → no data loss.
#

set -e

# Prevent AWS CLI from opening a pager (less) for each command
export AWS_PAGER=""

AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-178912016721}"
AWS_REGION="${AWS_REGION:-us-east-1}"
ECR_REPOSITORY="${ECR_REPOSITORY:-pure-cms}"
CLUSTER_NAME="${CLUSTER_NAME:-pure-cms-cluster}"
SERVICE_NAME="${SERVICE_NAME:-pure-cms-service}"
EFS_CREATION_TOKEN="pure-cms-data-$(date +%s)"
LOG_GROUP_NAME="/ecs/pure-cms"
TASK_FAMILY="pure-cms"
EXECUTION_ROLE_NAME="ecsTaskExecutionRole-pure-cms"
EFS_POLICY_NAME="EFSClientMount-pure-cms"

# SESSION_SECRET: used by the CMS to sign login cookies. You don't "get" it from anywhere—
# you create it (any long random string). If unset, we generate one for you.
if [ -z "$SESSION_SECRET" ]; then
	SESSION_SECRET=$(openssl rand -hex 32 2>/dev/null || true)
	if [ -z "$SESSION_SECRET" ]; then
		echo "Error: Could not generate SESSION_SECRET. Set it yourself: export SESSION_SECRET=your-long-random-string"
		exit 1
	fi
	echo "SESSION_SECRET not set; generated a random one (save it if you need to reuse later)."
fi

CORS_ORIGINS="${CORS_ORIGINS:-https://cms.conjee.com}"
ECR_IMAGE="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:latest"

echo "Region: $AWS_REGION"
echo "Cluster: $CLUSTER_NAME"
echo "Service: $SERVICE_NAME"
echo "ECR image: $ECR_IMAGE"
echo ""

# Resolve VPC and subnets if not set
if [ -z "$VPC_ID" ]; then
	VPC_ID=$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text --region "$AWS_REGION")
	if [ "$VPC_ID" = "None" ] || [ -z "$VPC_ID" ]; then
		echo "Error: No default VPC. Set VPC_ID and SUBNET_IDS."
		exit 1
	fi
	echo "Using default VPC: $VPC_ID"
fi

if [ -z "$SUBNET_IDS" ]; then
	SUBNET_IDS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[*].SubnetId' --output text --region "$AWS_REGION" | tr '\t' ',')
	echo "Using subnets: $SUBNET_IDS"
fi

# 1. EFS file system
echo "--- EFS ---"
EFS_ID=$(aws efs describe-file-systems --region "$AWS_REGION" --query "FileSystems[?Name=='pure-cms-data'].FileSystemId | [0]" --output text 2>/dev/null || true)
if [ -z "$EFS_ID" ] || [ "$EFS_ID" = "None" ]; then
	EFS_ID=$(aws efs create-file-system --region "$AWS_REGION" --creation-token "$EFS_CREATION_TOKEN" --performance-mode generalPurpose --throughput-mode bursting --encrypted --tags Key=Name,Value=pure-cms-data --query 'FileSystemId' --output text)
	echo "Created EFS: $EFS_ID"
	# Wait for EFS to be available
	aws efs describe-file-systems --file-system-id "$EFS_ID" --region "$AWS_REGION" --query 'FileSystems[0].LifeCycleState' --output text
else
	echo "Using existing EFS: $EFS_ID"
fi

# 2. Security group for EFS (NFS from ECS tasks) - create before mount targets
EFS_SG_NAME="pure-cms-efs-sg"
EFS_SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=$EFS_SG_NAME" "Name=vpc-id,Values=$VPC_ID" --query 'SecurityGroups[0].GroupId' --output text --region "$AWS_REGION" 2>/dev/null || true)
if [ -z "$EFS_SG_ID" ] || [ "$EFS_SG_ID" = "None" ]; then
	EFS_SG_ID=$(aws ec2 create-security-group --group-name "$EFS_SG_NAME" --description "Pure CMS EFS" --vpc-id "$VPC_ID" --region "$AWS_REGION" --query 'GroupId' --output text)
	echo "Created EFS security group: $EFS_SG_ID"
fi

# 3. Security group for ECS tasks (allow 3003 from anywhere for direct access; tighten with ALB later)
ECS_SG_NAME="pure-cms-ecs-sg"
ECS_SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=$ECS_SG_NAME" "Name=vpc-id,Values=$VPC_ID" --query 'SecurityGroups[0].GroupId' --output text --region "$AWS_REGION" 2>/dev/null || true)
if [ -z "$ECS_SG_ID" ] || [ "$ECS_SG_ID" = "None" ]; then
	ECS_SG_ID=$(aws ec2 create-security-group --group-name "$ECS_SG_NAME" --description "Pure CMS ECS tasks" --vpc-id "$VPC_ID" --region "$AWS_REGION" --query 'GroupId' --output text)
	aws ec2 authorize-security-group-ingress --group-id "$ECS_SG_ID" --protocol tcp --port 3003 --cidr 0.0.0.0/0 --region "$AWS_REGION" 2>/dev/null || true
	echo "Created ECS security group: $ECS_SG_ID"
else
	echo "Using ECS security group: $ECS_SG_ID"
fi

# 4. Allow EFS SG to receive NFS from ECS SG
aws ec2 authorize-security-group-ingress --group-id "$EFS_SG_ID" --protocol tcp --port 2049 --source-group "$ECS_SG_ID" --region "$AWS_REGION" 2>/dev/null || true

# 5. Mount targets (one per subnet; use EFS SG)
SUBNET_ARR=($(echo "$SUBNET_IDS" | tr ',' ' '))
for SUBNET_ID in "${SUBNET_ARR[@]}"; do
	EXISTING=$(aws efs describe-mount-targets --file-system-id "$EFS_ID" --region "$AWS_REGION" --query "MountTargets[?SubnetId=='$SUBNET_ID'].MountTargetId | [0]" --output text 2>/dev/null || true)
	if [ -z "$EXISTING" ] || [ "$EXISTING" = "None" ]; then
		aws efs create-mount-target --file-system-id "$EFS_ID" --subnet-id "$SUBNET_ID" --security-groups "$EFS_SG_ID" --region "$AWS_REGION" 2>/dev/null || true
		echo "Mount target in $SUBNET_ID"
	fi
done

# 6. ECS cluster
aws ecs create-cluster --cluster-name "$CLUSTER_NAME" --region "$AWS_REGION" 2>/dev/null || true
echo "Cluster: $CLUSTER_NAME"

# 7. Task execution role (ECR pull, logs, EFS mount)
EXECUTION_ROLE_ARN=$(aws iam get-role --role-name "$EXECUTION_ROLE_NAME" --query 'Role.Arn' --output text 2>/dev/null || true)
if [ -z "$EXECUTION_ROLE_ARN" ]; then
	aws iam create-role --role-name "$EXECUTION_ROLE_NAME" --assume-role-policy-document '{
		"Version":"2012-10-17",
		"Statement":[{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},"Action":"sts:AssumeRole"}]
	}' 2>/dev/null || true
	aws iam attach-role-policy --role-name "$EXECUTION_ROLE_NAME" --policy-arn "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy" 2>/dev/null || true
	# EFS client mount (use resource * or restrict to this EFS)
	aws iam put-role-policy --role-name "$EXECUTION_ROLE_NAME" --policy-name "$EFS_POLICY_NAME" --policy-document "{
		\"Version\":\"2012-10-17\",
		\"Statement\":[{
			\"Effect\":\"Allow\",
			\"Action\":[\"elasticfilesystem:ClientMount\",\"elasticfilesystem:ClientRootAccess\",\"elasticfilesystem:ClientWrite\"],
			\"Resource\":\"arn:aws:elasticfilesystem:${AWS_REGION}:${AWS_ACCOUNT_ID}:file-system/${EFS_ID}\"
		}]
	}" 2>/dev/null || true
	sleep 5
	EXECUTION_ROLE_ARN=$(aws iam get-role --role-name "$EXECUTION_ROLE_NAME" --query 'Role.Arn' --output text)
	echo "Created execution role: $EXECUTION_ROLE_ARN"
else
	echo "Using execution role: $EXECUTION_ROLE_ARN"
fi

# 8. Log group
aws logs create-log-group --log-group-name "$LOG_GROUP_NAME" --region "$AWS_REGION" 2>/dev/null || true

# 9. Task definition
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TASK_DEF_FILE="$SCRIPT_DIR/ecs-task-definition.json"
TASK_DEF_TMP=$(mktemp)
sed -e "s|EXECUTION_ROLE_ARN|$EXECUTION_ROLE_ARN|g" \
	-e "s|EFS_FILE_SYSTEM_ID|$EFS_ID|g" \
	-e "s|ECR_IMAGE_URI|$ECR_IMAGE|g" \
	-e "s|SESSION_SECRET_PLACEHOLDER|$SESSION_SECRET|g" \
	-e "s|CORS_ORIGINS_PLACEHOLDER|$CORS_ORIGINS|g" \
	-e "s|LOG_GROUP_NAME|$LOG_GROUP_NAME|g" \
	-e "s|AWS_REGION|$AWS_REGION|g" \
	"$TASK_DEF_FILE" > "$TASK_DEF_TMP"

aws ecs register-task-definition --cli-input-json "file://$TASK_DEF_TMP" --region "$AWS_REGION" --query 'taskDefinition.revision' --output text
rm -f "$TASK_DEF_TMP"
echo "Registered task definition: $TASK_FAMILY"

# 10. Service (public IP so we can reach it; use ALB in production for HTTPS)
SUBNET_JSON=$(echo "$SUBNET_IDS" | tr ',' '\n' | sed 's/^/"/;s/$/"/' | paste -sd, -)
aws ecs create-service \
	--cluster "$CLUSTER_NAME" \
	--service-name "$SERVICE_NAME" \
	--task-definition "$TASK_FAMILY" \
	--desired-count 1 \
	--launch-type FARGATE \
	--network-configuration "awsvpcConfiguration={subnets=[$SUBNET_JSON],securityGroups=[$ECS_SG_ID],assignPublicIp=ENABLED}" \
	--region "$AWS_REGION" \
	--query 'service.status' --output text 2>/dev/null || true

echo ""
echo "--- Done ---"
echo "Service is starting. To get the public IP of the task:"
echo "  aws ecs list-tasks --cluster $CLUSTER_NAME --service-name $SERVICE_NAME --region $AWS_REGION --query 'taskArns[0]' --output text"
echo "  aws ecs describe-tasks --cluster $CLUSTER_NAME --tasks <TASK_ARN> --region $AWS_REGION --query 'tasks[0].attachments[0].details[?name==\`networkInterfaceId\`].value' --output text"
echo "  aws ec2 describe-network-interfaces --network-interface-ids <ENI_ID> --region $AWS_REGION --query 'NetworkInterfaces[0].Association.PublicIp' --output text"
echo ""
echo "Then open http://<PUBLIC_IP>:3003 and create the first admin."
echo ""
echo "To update the service (new image, no data loss):"
echo "  aws ecs update-service --cluster $CLUSTER_NAME --service $SERVICE_NAME --force-new-deployment --region $AWS_REGION"
echo "  (EFS at /app/data is reattached to the new task; SQLite DB is preserved.)"
