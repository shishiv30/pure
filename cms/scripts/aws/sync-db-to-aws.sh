#!/usr/bin/env bash
#
# Sync local CMS database to AWS EFS volume.
# Copies cms/data/cms.db to the running ECS task's /app/data/cms.db (on EFS).
#
# Usage: ./cms/scripts/aws/sync-db-to-aws.sh [local-db-path]
# Example: ./cms/scripts/aws/sync-db-to-aws.sh cms/data/cms.db
#
# Requirements:
#   - AWS CLI configured
#   - ECS task must have execute command enabled (or use alternative method)
#   - Local database file must exist
#

set -e
export AWS_PAGER=""

AWS_REGION="${AWS_REGION:-us-east-1}"
CLUSTER_NAME="${CLUSTER_NAME:-pure-cms-cluster}"
SERVICE_NAME="${SERVICE_NAME:-pure-cms-service}"
CONTAINER_NAME="pure-cms"

# Default local DB path (from repo root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
LOCAL_DB="${1:-$REPO_ROOT/cms/data/cms.db}"

# Resolve absolute path
if [ ! -f "$LOCAL_DB" ]; then
	echo "Error: Local database file not found: $LOCAL_DB"
	echo "Usage: $0 [local-db-path]"
	echo "Example: $0 cms/data/cms.db"
	exit 1
fi

LOCAL_DB=$(cd "$(dirname "$LOCAL_DB")" && pwd)/$(basename "$LOCAL_DB")
echo "Local database: $LOCAL_DB"

# Get running task
echo "Finding running ECS task..."
TASK_ARN=$(aws ecs list-tasks --cluster "$CLUSTER_NAME" --service-name "$SERVICE_NAME" --region "$AWS_REGION" --query 'taskArns[0]' --output text 2>/dev/null || echo "")

if [ -z "$TASK_ARN" ] || [ "$TASK_ARN" = "None" ] || [ "$TASK_ARN" = "null" ]; then
	echo "Error: No running task found for $SERVICE_NAME in $CLUSTER_NAME"
	echo "Make sure the CMS service is running."
	exit 1
fi

echo "Found task: $TASK_ARN"

# Check if execute command is enabled
TASK_DEF_ARN=$(aws ecs describe-tasks --cluster "$CLUSTER_NAME" --tasks "$TASK_ARN" --region "$AWS_REGION" --query 'tasks[0].taskDefinitionArn' --output text)
TASK_DEF_FAMILY=$(aws ecs describe-task-definition --task-definition "$TASK_DEF_ARN" --region "$AWS_REGION" --query 'taskDefinition.family' --output text)

echo "Task definition: $TASK_DEF_FAMILY"

# Try to use ECS Exec to copy the file
echo ""
echo "Attempting to copy database file to EFS volume..."
echo "Target: /app/data/cms.db (on EFS mounted at /app/data)"

# Method: Use ECS Exec to copy the file
echo "Attempting to copy database file using ECS Exec..."
echo "Target: /app/data/cms.db (on EFS mounted at /app/data)"
echo ""

# Check if ECS Exec is enabled by trying a simple command
if aws ecs execute-command \
	--cluster "$CLUSTER_NAME" \
	--task "$TASK_ARN" \
	--container "$CONTAINER_NAME" \
	--command "echo 'ECS Exec test'" \
	--interactive \
	--region "$AWS_REGION" \
	>/dev/null 2>&1; then
	
	echo "✓ ECS Exec is enabled"
	echo "Copying database file..."
	
	# Encode the database file as base64
	echo "Encoding database file..."
	DB_B64=$(base64 < "$LOCAL_DB")
	DB_SIZE=$(ls -lh "$LOCAL_DB" | awk '{print $5}')
	echo "Database size: $DB_SIZE"
	
	# Copy via ECS Exec using base64 decode
	echo "Copying to EFS volume..."
	aws ecs execute-command \
		--cluster "$CLUSTER_NAME" \
		--task "$TASK_ARN" \
		--container "$CONTAINER_NAME" \
		--interactive \
		--region "$AWS_REGION" \
		--command "sh -c \"echo '$DB_B64' | base64 -d > /app/data/cms.db.backup && mv /app/data/cms.db.backup /app/data/cms.db && ls -lh /app/data/cms.db && echo '✓ Database synced successfully!'\""
	
	echo ""
	echo "✓ Database synced successfully!"
	echo ""
	echo "Note: Restart the CMS service to pick up the new database:"
	echo "  aws ecs update-service --cluster $CLUSTER_NAME --service $SERVICE_NAME --force-new-deployment --region $AWS_REGION"
	
else
	echo "✗ ECS Exec is not enabled for this task."
	echo ""
	echo "To enable ECS Exec:"
	echo ""
	echo "1. Get the current task definition:"
	echo "   aws ecs describe-task-definition --task-definition $TASK_DEF_FAMILY --region $AWS_REGION > task-def.json"
	echo ""
	echo "2. Edit task-def.json and add to the service definition:"
	echo "   \"enableExecuteCommand\": true"
	echo ""
	echo "3. Register the updated task definition:"
	echo "   aws ecs register-task-definition --cli-input-json file://task-def.json --region $AWS_REGION"
	echo ""
	echo "4. Update the service to use the new task definition:"
	echo "   aws ecs update-service --cluster $CLUSTER_NAME --service $SERVICE_NAME --task-definition $TASK_DEF_FAMILY --region $AWS_REGION"
	echo ""
	echo "5. Wait for the new task to start, then re-run this script."
	echo ""
	echo "Alternative: Use the CMS API endpoints to sync data programmatically,"
	echo "or manually copy the file using AWS Systems Manager Session Manager."
	exit 1
fi
