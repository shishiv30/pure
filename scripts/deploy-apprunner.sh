#!/usr/bin/env bash
#
# Deploy latest App Runner image
# Triggers App Runner to pull and deploy the latest image from ECR
#
# Usage: ./scripts/deploy-apprunner.sh

set -e
export AWS_PAGER=""

AWS_REGION="${AWS_REGION:-us-east-1}"
SERVICE_NAME="${SERVICE_NAME:-pure}"

echo "Getting App Runner service ARN..."
APP_ARN=$(aws apprunner list-services --region "$AWS_REGION" --query "ServiceSummaryList[?ServiceName=='$SERVICE_NAME'].ServiceArn" --output text)

if [ -z "$APP_ARN" ] || [ "$APP_ARN" = "None" ]; then
	echo "Error: App Runner service '$SERVICE_NAME' not found in $AWS_REGION"
	exit 1
fi

echo "Service ARN: $APP_ARN"

# Check current status
STATUS=$(aws apprunner describe-service --service-arn "$APP_ARN" --region "$AWS_REGION" --query 'Service.Status' --output text)
echo "Current status: $STATUS"

if [ "$STATUS" != "RUNNING" ]; then
	echo "Error: Service is not in RUNNING state (current: $STATUS)"
	echo "Please wait for any ongoing operations to complete, then try again."
	exit 1
fi

# Get latest image digest from ECR
echo ""
echo "Checking latest image in ECR..."
LATEST_IMAGE=$(aws ecr describe-images --repository-name pure --region "$AWS_REGION" --query 'sort_by(imageDetails,&imagePushedAt)[-1]' --output json)
LATEST_DIGEST=$(echo "$LATEST_IMAGE" | jq -r '.imageDigest')
LATEST_PUSHED=$(echo "$LATEST_IMAGE" | jq -r '.imagePushedAt')
echo "Latest image digest: $LATEST_DIGEST"
echo "Pushed at: $LATEST_PUSHED"

# Get current deployed image
CURRENT_IMAGE=$(aws apprunner describe-service --service-arn "$APP_ARN" --region "$AWS_REGION" --query 'Service.SourceConfiguration.ImageRepository.ImageIdentifier' --output text)
echo "Current image: $CURRENT_IMAGE"

# Update to use specific digest to force pull of latest image
echo ""
echo "Updating service to use latest image digest..."
aws apprunner update-service --service-arn "$APP_ARN" --region "$AWS_REGION" \
	--source-configuration "{
		\"ImageRepository\": {
			\"ImageIdentifier\": \"178912016721.dkr.ecr.$AWS_REGION.amazonaws.com/pure@$LATEST_DIGEST\",
			\"ImageRepositoryType\": \"ECR\",
			\"ImageConfiguration\": {
				\"RuntimeEnvironmentVariables\": {
					\"APP_URL\": \"https://www.conjeezou.com\",
					\"CDN_URL\": \"https://cdn.conjeezou.com\",
					\"SOA_API_DOMAIN\": \"https://www.movoto.com\",
					\"CMS_URL\": \"https://cms.conjeezou.com\"
				}
			}
		}
	}" \
	--query 'Service.{ServiceName:ServiceName,Status:Status}' --output table

echo ""
echo "✓ Service update initiated. App Runner will automatically deploy the new image."
echo "This may take 5-10 minutes. Monitor progress in AWS Console or with:"
echo "  aws apprunner describe-service --service-arn $APP_ARN --region $AWS_REGION --query 'Service.Status' --output text"
