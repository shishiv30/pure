#!/bin/bash

# AWS ECR Deployment Script for Pure CMS
# Usage (from repo root): ./cms/scripts/deploy-aws-ecr.sh [environment]
# Or from cms/: ./scripts/deploy-aws-ecr.sh [environment]
# Example: ./cms/scripts/deploy-aws-ecr.sh production
#
# Requires: aws configure, and export AWS_ACCOUNT_ID=your-account-id

set -e

ENVIRONMENT=${1:-production}
AWS_REGION=${AWS_REGION:-us-east-2}
ECR_REPOSITORY=${ECR_REPOSITORY:-pure-cms}
AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID}

if [ -z "$AWS_ACCOUNT_ID" ]; then
	echo "Error: AWS_ACCOUNT_ID environment variable is required"
	echo "Get it from: AWS Console → account dropdown (top right) → Account ID"
	echo "Example: export AWS_ACCOUNT_ID=123456789012"
	exit 1
fi

# Run from cms/ so Docker build context is correct
CMS_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$CMS_DIR"

ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
IMAGE_TAG="${ECR_REGISTRY}/${ECR_REPOSITORY}:${ENVIRONMENT}"
LATEST_TAG="${ECR_REGISTRY}/${ECR_REPOSITORY}:latest"

echo "Building Docker image for ${ENVIRONMENT} (from $CMS_DIR)..."
docker build --target production -t ${ECR_REPOSITORY}:${ENVIRONMENT} .

echo "Tagging image..."
docker tag ${ECR_REPOSITORY}:${ENVIRONMENT} ${IMAGE_TAG}
docker tag ${ECR_REPOSITORY}:${ENVIRONMENT} ${LATEST_TAG}

echo "Logging in to AWS ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}

echo "Pushing image to ECR..."
docker push ${IMAGE_TAG}
docker push ${LATEST_TAG}

echo "Deployment complete!"
echo "Image: ${IMAGE_TAG}"
echo "Latest: ${LATEST_TAG}"
