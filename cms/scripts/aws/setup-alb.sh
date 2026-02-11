#!/usr/bin/env bash
#
# Add an Application Load Balancer in front of the Pure CMS ECS service.
# Run after setup-ecs-efs.sh. Then point cms.conjeezou.com (CNAME) to the ALB DNS name.
# See setup-alb-and-dns.md for DNS and HTTPS steps.
#

set -e
export AWS_PAGER=""

AWS_REGION="${AWS_REGION:-us-east-1}"
CLUSTER_NAME="${CLUSTER_NAME:-pure-cms-cluster}"
SERVICE_NAME="${SERVICE_NAME:-pure-cms-service}"
ALB_NAME="pure-cms-alb"
TG_NAME="pure-cms-tg"
ALB_SG_NAME="pure-cms-alb-sg"

echo "Region: $AWS_REGION"
echo "Cluster: $CLUSTER_NAME"
echo "Service: $SERVICE_NAME"
echo ""

# Resolve VPC and subnets
if [ -z "$VPC_ID" ]; then
	VPC_ID=$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text --region "$AWS_REGION")
fi
if [ -z "$SUBNET_IDS" ]; then
	SUBNET_IDS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[*].SubnetId' --output text --region "$AWS_REGION" | tr '\t' ',')
fi
SUBNET_ARR=($(echo "$SUBNET_IDS" | tr ',' ' '))
# ALB needs exactly 2 subnets in different AZs
if [ ${#SUBNET_ARR[@]} -lt 2 ]; then
	echo "Error: Need at least 2 subnets for the ALB."
	exit 1
fi
SUBNET1="${SUBNET_ARR[0]}"
SUBNET2="${SUBNET_ARR[1]}"

# 1. Security group for ALB (allow 80, 443 from internet)
ALB_SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=$ALB_SG_NAME" "Name=vpc-id,Values=$VPC_ID" --query 'SecurityGroups[0].GroupId' --output text --region "$AWS_REGION" 2>/dev/null || true)
if [ -z "$ALB_SG_ID" ] || [ "$ALB_SG_ID" = "None" ]; then
	ALB_SG_ID=$(aws ec2 create-security-group --group-name "$ALB_SG_NAME" --description "Pure CMS ALB" --vpc-id "$VPC_ID" --region "$AWS_REGION" --query 'GroupId' --output text)
	aws ec2 authorize-security-group-ingress --group-id "$ALB_SG_ID" --protocol tcp --port 80 --cidr 0.0.0.0/0 --region "$AWS_REGION"
	aws ec2 authorize-security-group-ingress --group-id "$ALB_SG_ID" --protocol tcp --port 443 --cidr 0.0.0.0/0 --region "$AWS_REGION"
	echo "Created ALB security group: $ALB_SG_ID"
else
	echo "Using ALB security group: $ALB_SG_ID"
fi

# 2. Create ALB
ALB_ARN=$(aws elbv2 describe-load-balancers --names "$ALB_NAME" --region "$AWS_REGION" --query 'LoadBalancers[0].LoadBalancerArn' --output text 2>/dev/null || true)
if [ -z "$ALB_ARN" ] || [ "$ALB_ARN" = "None" ]; then
	ALB_ARN=$(aws elbv2 create-load-balancer \
		--name "$ALB_NAME" \
		--type application \
		--scheme internet-facing \
		--subnets "$SUBNET1" "$SUBNET2" \
		--security-groups "$ALB_SG_ID" \
		--region "$AWS_REGION" \
		--query 'LoadBalancers[0].LoadBalancerArn' --output text)
	ALB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns "$ALB_ARN" --region "$AWS_REGION" --query 'LoadBalancers[0].DNSName' --output text)
	echo "Created ALB: $ALB_DNS"
else
	ALB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns "$ALB_ARN" --region "$AWS_REGION" --query 'LoadBalancers[0].DNSName' --output text)
	echo "Using existing ALB: $ALB_DNS"
fi

# 3. Target group (port 3003, IP target type for Fargate)
TG_ARN=$(aws elbv2 describe-target-groups --names "$TG_NAME" --region "$AWS_REGION" --query 'TargetGroups[0].TargetGroupArn' --output text 2>/dev/null || true)
if [ -z "$TG_ARN" ] || [ "$TG_ARN" = "None" ]; then
	TG_ARN=$(aws elbv2 create-target-group \
		--name "$TG_NAME" \
		--protocol HTTP \
		--port 3003 \
		--vpc-id "$VPC_ID" \
		--target-type ip \
		--health-check-path /health \
		--health-check-interval-seconds 30 \
		--region "$AWS_REGION" \
		--query 'TargetGroups[0].TargetGroupArn' --output text)
	echo "Created target group: $TG_NAME"
else
	echo "Using existing target group: $TG_NAME"
fi

# 4. Listener (HTTP 80 -> target group)
LISTENER_ARN=$(aws elbv2 describe-listeners --load-balancer-arn "$ALB_ARN" --region "$AWS_REGION" --query 'Listeners[?Port==`80`].ListenerArn | [0]' --output text 2>/dev/null || true)
if [ -z "$LISTENER_ARN" ] || [ "$LISTENER_ARN" = "None" ]; then
	aws elbv2 create-listener \
		--load-balancer-arn "$ALB_ARN" \
		--protocol HTTP \
		--port 80 \
		--default-actions Type=forward,TargetGroupArn="$TG_ARN" \
		--region "$AWS_REGION"
	echo "Created HTTP listener on port 80"
else
	echo "HTTP listener already exists"
fi

# 5. Update ECS service to attach to target group
aws ecs update-service \
	--cluster "$CLUSTER_NAME" \
	--service "$SERVICE_NAME" \
	--load-balancers "targetGroupArn=$TG_ARN,containerName=pure-cms,containerPort=3003" \
	--force-new-deployment \
	--region "$AWS_REGION" \
	--query 'service.serviceName' --output text

echo ""
echo "--- Done ---"
echo "ALB DNS name: $ALB_DNS"
echo ""
echo "Next: Point cms.conjeezou.com to this ALB:"
echo "  Create a CNAME record:  cms  ->  $ALB_DNS"
echo ""
echo "Then open http://cms.conjeezou.com (or https:// after you add an HTTPS listener and certificate)."
echo "See setup-alb-and-dns.md for DNS and HTTPS steps."
