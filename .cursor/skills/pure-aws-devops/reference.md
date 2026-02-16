# Pure AWS DevOps – Reference

## Sync local CMS DB to AWS

- **API sync (no ECS Exec needed):** `cms/scripts/sync-db-via-api.js`. Reads local `cms/data/cms.db`, logs in to `CMS_URL` with `CMS_EMAIL`/`CMS_PASSWORD`, and POST/PUTs pages, sitemap, comp. Use `CMS_URL=https://cms.conjeezou.com` (or your ALB URL). Credentials from `.env.local` are fine; ensure `CMS_URL` points at AWS.
- **Old schema (no `pages.path`):** Sync omits `path` by default. After deploy, call **POST** `/api/setup/migrate-pages-path` once (admin session). Then `SYNC_INCLUDE_PATH=1` and sync again to send path.
- **Full file copy:** `cms/scripts/aws/sync-db-to-aws.sh cms/data/cms.db` overwrites EFS DB; requires ECS Exec (and thus a task role in the task definition).

---

## us-east-1 resource names and IDs

Use these when running CLI commands or checking the console.

| Type | Name / ID | Notes |
|------|-----------|--------|
| ECS cluster | pure-cms-cluster | |
| ECS service | pure-cms-service | |
| ALB | pure-cms-alb | DNS: pure-cms-alb-1420427632.us-east-1.elb.amazonaws.com |
| Target group | pure-cms-tg | Port 3003 |
| EFS | fs-06f8b66a4118ec000 | Name: pure-cms-data |
| ECR repo (CMS) | pure-cms | 178912016721.dkr.ecr.us-east-1.amazonaws.com/pure-cms |
| ECR repo (main site) | pure | 178912016721.dkr.ecr.us-east-1.amazonaws.com/pure (App Runner must use this us-east-1 URI) |
| SG (ALB) | pure-cms-alb-sg | 80, 443 |
| SG (ECS tasks) | pure-cms-ecs-sg | 3003 |
| SG (EFS) | pure-cms-efs-sg | NFS from ECS SG |
| Log group | /ecs/pure-cms | |
| App Runner | pure | qis7miipe5.us-east-1.awsapprunner.com. Source must be **us-east-1** ECR (`...us-east-1.../pure:latest`); if it was us-east-2, see **docs/apprunner-ecr-us-east-1.md**. ARN for CI: set repo var **APP_RUNNER_SERVICE_ARN** so Build Pure Web (prod) runs `start-deployment` after ECR push. |
| IAM role | ecsTaskExecutionRole-pure-cms | Account-level |
| Route 53 zone | Z038191012SF55SAOLG35 | conjeezou.com |

Full inventory with descriptions: repo root **docs/aws-us-east-1-resources.md** (regenerate with CLI if IDs change).

---

## ECS task execution role (recreate if deleted)

Trust policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "ecs-tasks.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}
```

- Attach managed policy: **arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy**
- Inline policy name: **EFSClientMount-pure-cms**
- Inline policy: allow **elasticfilesystem:ClientMount**, **ClientRootAccess**, **ClientWrite** on resource **arn:aws:elasticfilesystem:REGION:ACCOUNT_ID:file-system/EFS_ID** (use the EFS id for the region, e.g. fs-06f8b66a4118ec000 in us-east-1).

---

## ALB subnet fix (target in different AZ)

```bash
# List current ALB subnets
aws elbv2 describe-load-balancers --names pure-cms-alb --region us-east-1 \
  --query 'LoadBalancers[0].AvailabilityZones[*].SubnetId' --output text

# Add a subnet (keep ≥2 AZs)
aws elbv2 set-subnets --load-balancer-arn <ALB_ARN> --region us-east-1 \
  --subnets subnet-xxx subnet-yyy subnet-zzz
```

---

## Quick health check

```bash
# Target health
aws elbv2 describe-target-health --target-group-arn $(aws elbv2 describe-target-groups --names pure-cms-tg --region us-east-1 --query 'TargetGroups[0].TargetGroupArn' --output text) --region us-east-1

# HTTP to ALB
curl -sI http://pure-cms-alb-1420427632.us-east-1.elb.amazonaws.com/health
```
