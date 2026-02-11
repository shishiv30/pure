# Migrate CMS from us-east-2 to us-east-1

If your CMS (ECS, ALB, EFS, ECR) is currently in **us-east-2** and you want everything in **us-east-1**, follow this order. The scripts in this repo now default to **us-east-1**.

## 1. Create the stack in us-east-1

### 1.1 ECR repository

Create the repo so the image can be pushed (or let the GitHub Actions workflow create it on first run):

```bash
aws ecr create-repository --repository-name pure-cms --region us-east-1
```

Optional: set GitHub variable **AWS_REGION** to `us-east-1` (or leave unset; the workflow now defaults to us-east-1) so future pushes go to us-east-1.

### 1.2 Push the image to us-east-1

Either push from your machine or trigger the CMS workflow (with region us-east-1):

```bash
export AWS_REGION=us-east-1
./cms/scripts/deploy-aws-ecr.sh
```

### 1.3 ACM certificate in us-east-1

In **AWS Console → Certificate Manager**, switch region to **us-east-1**, then request a **public certificate** for `cms.conjeezou.com` with **DNS validation**. Complete validation so the cert shows **Issued**. (Certificates are per-region; the one in us-east-2 cannot be used in us-east-1.)

### 1.4 ECS + EFS in us-east-1

From the repo root, with any required env (e.g. `SESSION_SECRET`, `CORS_ORIGINS`):

```bash
export AWS_PAGER=""
./cms/scripts/aws/setup-ecs-efs.sh
```

(`AWS_REGION` defaults to us-east-1.) This creates EFS, ECS cluster, task definition, and service. Wait until the task is running.

### 1.5 ALB + HTTPS in us-east-1

```bash
./cms/scripts/aws/setup-alb.sh
./cms/scripts/aws/setup-alb-https.sh
```

Note the **ALB DNS name** printed at the end (it will be `...us-east-1.elb.amazonaws.com`).

## 2. Point DNS to us-east-1

Update the **CNAME** for **cms.conjeezou.com** to the **new ALB DNS name** (us-east-1). After DNS propagates, **https://cms.conjeezou.com** will hit the us-east-1 stack.

## 3. (Optional) Migrate EFS data

If you need to keep the existing SQLite DB and uploads from us-east-2:

- Use a temporary EC2 instance (or Lambda, or DataSync) in us-east-2 to read from the old EFS, and in us-east-1 to write to the new EFS; or
- Use `aws efs create-replication-configuration` for EFS replication (if available), or copy files (e.g. `cms.db`) via S3 or another transfer method.

If you are fine starting with a fresh DB in us-east-1, skip this and create the first admin again at https://cms.conjeezou.com.

## 4. Clean up us-east-2 (after verification)

Once the us-east-1 CMS is working and DNS points there:

1. **ECS**: Delete the service (set desired count to 0, then delete), then delete the cluster.
2. **ALB**: Delete the load balancer (listeners and target group will be removed).
3. **EFS**: Delete the file system (and mount targets).
4. **ECR**: Optionally delete the us-east-2 `pure-cms` repository or leave it for rollback.
5. **ACM**: Optionally delete the us-east-2 certificate.
6. **Security groups / IAM roles**: Remove any that were created only for the CMS in us-east-2 (e.g. `pure-cms-alb-sg`, ECS task execution role, etc.).

Do this in the **us-east-2** console or CLI, e.g.:

```bash
export AWS_REGION=us-east-2
# Delete ECS service and cluster, ALB, EFS, etc. (see cms/README.md for resource names)
```

## Summary

| Step | Action |
|------|--------|
| 1 | Create ECR repo in us-east-1, push image |
| 2 | Request ACM cert in us-east-1 for cms.conjeezou.com |
| 3 | Run `setup-ecs-efs.sh` (defaults to us-east-1) |
| 4 | Run `setup-alb.sh` and `setup-alb-https.sh` |
| 5 | Update CNAME for cms.conjeezou.com to new ALB DNS |
| 6 | (Optional) Migrate EFS data |
| 7 | After verification, delete us-east-2 resources |

All scripts and the GitHub Actions workflow now default to **us-east-1**, so new setups will use that region.
