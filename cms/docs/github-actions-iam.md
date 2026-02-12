# GitHub Actions and local AWS CLI (ECR)

## Two workflows that push to ECR

| Workflow | File | ECR repo (default) |
|----------|------|---------------------|
| **Build (prod)** – main app | `.github/workflows/build-prod.yml` | `pure` |
| **Build CMS (prod)** | `.github/workflows/build-cms-prd.yml` | `pure-cms` |

The same IAM user (GitHub Actions secrets) is used for both. It must have ECR permissions for **both** repositories (or use `repository/*`).

## Required IAM permissions (ECR only)

The IAM user used in GitHub Actions (secrets `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`) needs:

| Action | Purpose |
|--------|--------|
| `ecr:GetAuthorizationToken` | So Docker can log in to ECR (resource: `*`) |
| `ecr:DescribeRepositories` | Check if the repo exists |
| `ecr:CreateRepository` | Let the workflow create the repo if missing (otherwise create `pure` and `pure-cms` manually once) |
| `ecr:BatchCheckLayerAvailability` | Push image layers |
| `ecr:GetDownloadUrlForLayer` | Push image layers |
| `ecr:PutImage` | Push image manifest |
| `ecr:InitiateLayerUpload` | Push image layers |
| `ecr:UploadLayerPart` | Push image layers |
| `ecr:CompleteLayerUpload` | Push image layers |

## Policy for GitHub Actions (both repos)

Attach a custom policy like this to the IAM user (e.g. `github-actions`). Replace `ACCOUNT_ID` and `REGION` (e.g. `178912016721`, `us-east-1`).

**Use `repository/*`** so both `pure` and `pure-cms` are allowed (and the workflow can create them if they don’t exist):

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
      "Resource": "arn:aws:ecr:REGION:ACCOUNT_ID:repository/*"
    }
  ]
}
```

If you prefer to limit to the two repo names only:

```json
"Resource": [
  "arn:aws:ecr:REGION:ACCOUNT_ID:repository/pure",
  "arn:aws:ecr:REGION:ACCOUNT_ID:repository/pure-cms"
]
```

### If you see AccessDeniedException on CreateRepository

Error: `User ... is not authorized to perform: ecr:CreateRepository on resource: ... repository/pure`.

1. **Permissions boundary** – IAM user permissions are limited by both attached policies and the **permissions boundary** (if set). If the boundary does not allow `ecr:CreateRepository`, the action is denied even if you attached **AmazonEC2ContainerRegistryPowerUser**.  
   **Check:** IAM → Users → **github-actions** → Permissions tab → look for **Permissions boundary**. If one is set, either add `ecr:CreateRepository` (and other ECR actions) to that boundary policy, or remove the boundary for this user.

2. **Scope** – If using a custom policy, ensure the ECR `Resource` includes both **pure** and **pure-cms** (or `repository/*`).

3. **Workaround (no CreateRepository needed)** – Create the repo once with a principal that has permission (e.g. your admin user), then re-run the workflow. The workflow only needs the repo to exist; it will use **DescribeRepositories** and then push. From the repo root:
   ```bash
   aws ecr create-repository --repository-name pure --region us-east-1
   # and if needed:
   aws ecr create-repository --repository-name pure-cms --region us-east-1
   ```

### If you do not grant ecr:CreateRepository

Create both repos once yourself:

```bash
aws ecr create-repository --repository-name pure --region us-east-1
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
