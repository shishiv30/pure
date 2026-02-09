#!/bin/bash

# Setup S3 bucket and CloudFront distribution for cdn.conjeezou.com
# Prerequisites: AWS CLI configured, ACM certificate already created

set -e

# Configuration
BUCKET_NAME="cdn.conjeezou.com"
DOMAIN_NAME="cdn.conjeezou.com"
REGION="us-east-1"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== S3 + CloudFront Setup for ${DOMAIN_NAME} ===${NC}\n"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
  echo -e "${RED}Error: AWS CLI not found. Install it with: brew install awscli${NC}"
  exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
  echo -e "${RED}Error: AWS credentials not configured. Run: aws configure${NC}"
  exit 1
fi

# Get or prompt for certificate ARN
echo -e "${YELLOW}Looking for ACM certificate...${NC}"
CERT_ARN=$(aws acm list-certificates --region "$REGION" \
  --query 'CertificateSummaryList[?contains(DomainName, `cdn.conjeezou.com`) || contains(DomainName, `*.conjeezou.com`)].CertificateArn' \
  --output text | head -n1)

if [ -z "$CERT_ARN" ]; then
  echo -e "${YELLOW}Certificate not found automatically.${NC}"
  echo -e "Please enter your ACM certificate ARN for ${DOMAIN_NAME}:"
  read -r CERT_ARN
  if [ -z "$CERT_ARN" ]; then
    echo -e "${RED}Error: Certificate ARN is required${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}Found certificate: ${CERT_ARN}${NC}"
fi

# Get account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}Account ID: ${ACCOUNT_ID}${NC}\n"

# Step 1: Check if bucket exists, create if not
echo -e "${GREEN}Step 1: Checking S3 bucket...${NC}"
if aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
  echo -e "${YELLOW}Bucket ${BUCKET_NAME} already exists${NC}"
else
  echo -e "${GREEN}Creating S3 bucket...${NC}"
  if [ "$REGION" = "us-east-1" ]; then
    aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$REGION"
  else
    aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$REGION" \
      --create-bucket-configuration LocationConstraint="$REGION"
  fi
  echo -e "${GREEN}✓ Bucket created${NC}"
fi

# Step 2: Block public access
echo -e "${GREEN}Step 2: Blocking public access...${NC}"
aws s3api put-public-access-block \
  --bucket "$BUCKET_NAME" \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
echo -e "${GREEN}✓ Public access blocked${NC}"

# Step 3: Enable versioning
echo -e "${GREEN}Step 3: Enabling versioning...${NC}"
aws s3api put-bucket-versioning \
  --bucket "$BUCKET_NAME" \
  --versioning-configuration Status=Enabled
echo -e "${GREEN}✓ Versioning enabled${NC}"

# Step 4: Create Origin Access Control (OAC)
echo -e "${GREEN}Step 4: Creating Origin Access Control...${NC}"
OAC_EXISTS=$(aws cloudfront list-origin-access-controls \
  --query "OriginAccessControlList.Items[?Name=='${BUCKET_NAME}-oac'].Id" \
  --output text)

if [ -n "$OAC_EXISTS" ]; then
  echo -e "${YELLOW}OAC already exists: ${OAC_EXISTS}${NC}"
  OAC_ID="$OAC_EXISTS"
else
  OAC_OUTPUT=$(aws cloudfront create-origin-access-control \
    --origin-access-control-config \
      Name="${BUCKET_NAME}-oac",OriginAccessControlOriginType=s3,SigningBehavior=always,SigningProtocol=sigv4)
  OAC_ID=$(echo "$OAC_OUTPUT" | grep -o '"Id": "[^"]*' | cut -d'"' -f4)
  echo -e "${GREEN}✓ OAC created: ${OAC_ID}${NC}"
fi

# Step 5: Create/update bucket policy
echo -e "${GREEN}Step 5: Creating bucket policy...${NC}"
TEMP_POLICY=$(mktemp)
cat > "$TEMP_POLICY" <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::${BUCKET_NAME}/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::${ACCOUNT_ID}:distribution/*"
        }
      }
    }
  ]
}
EOF

aws s3api put-bucket-policy --bucket "$BUCKET_NAME" --policy "file://${TEMP_POLICY}"
rm -f "$TEMP_POLICY"
echo -e "${GREEN}✓ Bucket policy updated${NC}"

# Step 6: Check if CloudFront distribution already exists
echo -e "${GREEN}Step 6: Checking CloudFront distribution...${NC}"
EXISTING_DIST=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Aliases.Items[?@=='${DOMAIN_NAME}']].Id" \
  --output text)

if [ -n "$EXISTING_DIST" ]; then
  echo -e "${YELLOW}CloudFront distribution already exists: ${EXISTING_DIST}${NC}"
  DISTRIBUTION_ID="$EXISTING_DIST"
  DIST_INFO=$(aws cloudfront get-distribution --id "$DISTRIBUTION_ID")
  DISTRIBUTION_DOMAIN=$(echo "$DIST_INFO" | grep -o '"DomainName": "[^"]*' | head -1 | cut -d'"' -f4)
else
  # Create CloudFront distribution
  echo -e "${GREEN}Creating CloudFront distribution...${NC}"
  TEMP_CF_CONFIG=$(mktemp)
  cat > "$TEMP_CF_CONFIG" <<EOF
{
  "CallerReference": "cdn-$(date +%s)",
  "Comment": "CDN for ${DOMAIN_NAME}",
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-${BUCKET_NAME}",
        "DomainName": "${BUCKET_NAME}.s3.${REGION}.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        },
        "OriginAccessControlId": "${OAC_ID}"
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-${BUCKET_NAME}",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "Compress": true,
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000
  },
  "Enabled": true,
  "Aliases": {
    "Quantity": 1,
    "Items": ["${DOMAIN_NAME}"]
  },
  "ViewerCertificate": {
    "ACMCertificateArn": "${CERT_ARN}",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021"
  }
}
EOF

  CF_OUTPUT=$(aws cloudfront create-distribution --distribution-config "file://${TEMP_CF_CONFIG}")
  DISTRIBUTION_ID=$(echo "$CF_OUTPUT" | grep -o '"Id": "[^"]*' | head -1 | cut -d'"' -f4)
  DISTRIBUTION_DOMAIN=$(echo "$CF_OUTPUT" | grep -o '"DomainName": "[^"]*' | head -1 | cut -d'"' -f4)
  rm -f "$TEMP_CF_CONFIG"
  echo -e "${GREEN}✓ CloudFront distribution created${NC}"
fi

echo ""
echo -e "${GREEN}=== Setup Complete! ===${NC}\n"
echo -e "${YELLOW}Distribution ID: ${DISTRIBUTION_ID}${NC}"
echo -e "${YELLOW}Distribution Domain: ${DISTRIBUTION_DOMAIN}${NC}"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Update your DNS:"
echo "   - Route 53: Create an A record (alias) for ${DOMAIN_NAME} → CloudFront distribution"
echo "   - Other DNS: Create CNAME ${DOMAIN_NAME} → ${DISTRIBUTION_DOMAIN}"
echo ""
echo "2. Wait 5-15 minutes for CloudFront to deploy"
echo "   Check status: aws cloudfront get-distribution --id ${DISTRIBUTION_ID} --query 'Distribution.Status'"
echo ""
echo "3. Upload files to S3:"
echo "   aws s3 sync ./dist/ s3://${BUCKET_NAME}/"
echo ""
echo "4. Test: https://${DOMAIN_NAME} (after DNS propagates)"
