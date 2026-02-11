# GitHub Actions and local AWS CLI for CMS

## What the CMS workflow needs (Build CMS prod)

The workflow **Build CMS (prod)** (`.github/workflows/build-cms-prd.yml`) only builds the Docker image and pushes it to ECR. It does **not** create or update ECS, EFS, or any other resources.

### Required IAM permissions (ECR only)

The IAM user used in GitHub Actions (secrets `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`) needs:

| Action | Purpose |
|--------|--------|
| `ecr:GetAuthorizationToken` | So Docker can log in to ECR (resource: `*`) |
| `ecr:DescribeRepositories` | Check if the repo exists |
| `ecr:CreateRepository` | Optional; only if you want the workflow to create the repo (otherwise create it manually once) |
| `ecr:BatchCheckLayerAvailability` | Push image layers |
| `ecr:GetDownloadUrlForLayer` | Push image layers |
| `ecr:PutImage` | Push image manifest |
| `ecr:InitiateLayerUpload` | Push image layers |
| `ecr:UploadLayerPart` | Push image layers |
| `ecr:CompleteLayerUpload` | Push image layers |

### Minimal policy (ECR only, CMS workflow)

Attach a custom policy like this to the GitHub Actions IAM user (e.g. `github-actions`). Replace `ACCOUNT_ID` and `REGION` if you want to restrict to one repo.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "ecr:GetAuthorizationToken",
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:DescribeRepositories",
        "ecr:CreateRepository"
      ],
      "Resource": "arn:aws:ecr:us-east-1:ACCOUNT_ID:repository/pure-cms"
    }
  ]
}
```

To allow any repository name (e.g. if you set `ECR_REPOSITORY_CMS` to something else), use:

```text
"Resource": "arn:aws:ecr:us-east-1:ACCOUNT_ID:repository/*"
```

If you **do not** grant `ecr:CreateRepository`, create the ECR repository once yourself:

```bash
aws ecr create-repository --repository-name pure-cms --region us-east-1
```

---

## Running the same thing locally (AWS CLI)

You can do the same build-and-push from your machine with the AWS CLI. No GitHub Actions needed.

1. **Configure AWS** (one-time):

   ```bash
   aws configure
   ```

   Use the same IAM user (or any user with the ECR permissions above).

2. **Create the ECR repository** (if it doesn’t exist):

   ```bash
   aws ecr create-repository --repository-name pure-cms --region us-east-1
   ```

3. **Build and push the CMS image** (from repo root):

   ```bash
   export AWS_ACCOUNT_ID=123456789012
   ./cms/scripts/deploy-aws-ecr.sh production
   ```

   Or from the `cms/` directory:

   ```bash
   export AWS_ACCOUNT_ID=123456789012
   ./scripts/deploy-aws-ecr.sh production
   ```

That script builds the image, logs in to ECR, and pushes `pure-cms:production` and `pure-cms:latest`. It uses the same ECR repo and region (default `us-east-1`) as the workflow.

**Summary:** The rights GitHub Actions needs are ECR-only (list above). You can run the same steps locally with `aws configure` and `./cms/scripts/deploy-aws-ecr.sh`.
