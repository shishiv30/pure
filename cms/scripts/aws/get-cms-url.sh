#!/usr/bin/env bash
# Print the public URL (IP:3003) of the running Pure CMS ECS task.
# Run from repo root: ./cms/scripts/aws/get-cms-url.sh

set -e
export AWS_PAGER=""

AWS_REGION="${AWS_REGION:-us-east-1}"
CLUSTER_NAME="${CLUSTER_NAME:-pure-cms-cluster}"
SERVICE_NAME="${SERVICE_NAME:-pure-cms-service}"

TASK_ARN=$(aws ecs list-tasks --cluster "$CLUSTER_NAME" --service-name "$SERVICE_NAME" --region "$AWS_REGION" --query 'taskArns[0]' --output text 2>/dev/null || true)
if [ -z "$TASK_ARN" ] || [ "$TASK_ARN" = "None" ]; then
	echo "No running task found for $SERVICE_NAME."
	exit 1
fi

ENI_ID=$(aws ecs describe-tasks --cluster "$CLUSTER_NAME" --tasks "$TASK_ARN" --region "$AWS_REGION" --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value | [0]' --output text 2>/dev/null || true)
if [ -z "$ENI_ID" ] || [ "$ENI_ID" = "None" ]; then
	echo "Task not yet attached to network."
	exit 1
fi

PUBLIC_IP=$(aws ec2 describe-network-interfaces --network-interface-ids "$ENI_ID" --region "$AWS_REGION" --query 'NetworkInterfaces[0].Association.PublicIp' --output text 2>/dev/null || true)
if [ -z "$PUBLIC_IP" ] || [ "$PUBLIC_IP" = "None" ]; then
	echo "No public IP (task may be in private subnet)."
	exit 1
fi

echo "http://${PUBLIC_IP}:3003"
