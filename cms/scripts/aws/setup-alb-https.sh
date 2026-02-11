#!/usr/bin/env bash
#
# Add HTTPS (port 443) listener to the Pure CMS ALB with an ACM certificate.
# Run after setup-alb.sh and after you have an ACM cert for cms.conjeezou.com.
# Optional: CERT_ARN=arn:aws:acm:... ./scripts/aws/setup-alb-https.sh
#

set -e
export AWS_PAGER=""

AWS_REGION="${AWS_REGION:-us-east-1}"
ALB_NAME="pure-cms-alb"
TG_NAME="pure-cms-tg"
ALB_SG_NAME="pure-cms-alb-sg"
CERT_DOMAIN="${CERT_DOMAIN:-cms.conjeezou.com}"

echo "Region: $AWS_REGION"
echo "ALB: $ALB_NAME"
echo "Certificate domain: $CERT_DOMAIN"
echo ""

# Resolve ALB and target group
ALB_ARN=$(aws elbv2 describe-load-balancers --names "$ALB_NAME" --region "$AWS_REGION" --query 'LoadBalancers[0].LoadBalancerArn' --output text 2>/dev/null || true)
if [ -z "$ALB_ARN" ] || [ "$ALB_ARN" = "None" ]; then
	echo "Error: Load balancer $ALB_NAME not found in $AWS_REGION."
	exit 1
fi

TG_ARN=$(aws elbv2 describe-target-groups --names "$TG_NAME" --region "$AWS_REGION" --query 'TargetGroups[0].TargetGroupArn' --output text 2>/dev/null || true)
if [ -z "$TG_ARN" ] || [ "$TG_ARN" = "None" ]; then
	echo "Error: Target group $TG_NAME not found."
	exit 1
fi

# Resolve certificate ARN (use CERT_ARN if set, else find by domain)
if [ -n "$CERT_ARN" ]; then
	echo "Using certificate: $CERT_ARN"
else
	CERT_ARN=$(aws acm list-certificates --region "$AWS_REGION" --query "CertificateSummaryList[?DomainName=='$CERT_DOMAIN'].CertificateArn | [0]" --output text 2>/dev/null || true)
	# Also try wildcard: *.conjeezou.com
	if [ -z "$CERT_ARN" ] || [ "$CERT_ARN" = "None" ]; then
		BASE_DOMAIN="${CERT_DOMAIN#*.}"
		CERT_ARN=$(aws acm list-certificates --region "$AWS_REGION" --query "CertificateSummaryList[?DomainName=='*.$BASE_DOMAIN'].CertificateArn | [0]" --output text 2>/dev/null || true)
	fi
	if [ -z "$CERT_ARN" ] || [ "$CERT_ARN" = "None" ]; then
		echo "Error: No ACM certificate found for $CERT_DOMAIN in $AWS_REGION."
		echo "Request one in Certificate Manager, then run this script again, or set CERT_ARN=arn:aws:acm:..."
		exit 1
	fi
	echo "Using certificate: $CERT_ARN"
fi

# Ensure ALB security group allows 443
VPC_ID=$(aws elbv2 describe-load-balancers --load-balancer-arns "$ALB_ARN" --region "$AWS_REGION" --query 'LoadBalancers[0].VpcId' --output text)
ALB_SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=$ALB_SG_NAME" "Name=vpc-id,Values=$VPC_ID" --query 'SecurityGroups[0].GroupId' --output text --region "$AWS_REGION" 2>/dev/null || true)
if [ -n "$ALB_SG_ID" ] && [ "$ALB_SG_ID" != "None" ]; then
	HAS_443=$(aws ec2 describe-security-groups --group-ids "$ALB_SG_ID" --region "$AWS_REGION" --query 'SecurityGroups[0].IpPermissions[?FromPort==`443`]' --output text 2>/dev/null || true)
	if [ -z "$HAS_443" ]; then
		aws ec2 authorize-security-group-ingress --group-id "$ALB_SG_ID" --protocol tcp --port 443 --cidr 0.0.0.0/0 --region "$AWS_REGION"
		echo "Added inbound 443 to ALB security group $ALB_SG_ID"
	else
		echo "ALB security group already allows 443"
	fi
fi

# Add HTTPS listener if missing
HTTPS_ARN=$(aws elbv2 describe-listeners --load-balancer-arn "$ALB_ARN" --region "$AWS_REGION" --query 'Listeners[?Port==`443`].ListenerArn | [0]' --output text 2>/dev/null || true)
if [ -z "$HTTPS_ARN" ] || [ "$HTTPS_ARN" = "None" ]; then
	aws elbv2 create-listener \
		--load-balancer-arn "$ALB_ARN" \
		--protocol HTTPS \
		--port 443 \
		--certificates CertificateArn="$CERT_ARN" \
		--default-actions Type=forward,TargetGroupArn="$TG_ARN" \
		--region "$AWS_REGION"
	echo "Created HTTPS listener on port 443"
else
	echo "HTTPS listener already exists on port 443"
fi

echo ""
echo "--- Done ---"
echo "Try: https://$CERT_DOMAIN"
