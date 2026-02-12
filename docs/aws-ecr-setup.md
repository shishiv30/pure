# AWS ECR setup for GitHub Actions

Use this when you're ready to push Docker images to AWS. Until you complete it, the **Build and Release to AWS ECR** workflow is skipped on push (no failed runs). The job runs only when the repo variable **AWS_ECR_ENABLED** is set to `true`.

---

## Quick setup (AWS CLI)

If you have an AWS account and want to do everything from the terminal:

1. **Install and configure AWS CLI** (one-time):

   ```bash
   brew install awscli
   aws configure
   ```

   Enter your **Access Key ID** and **Secret Access Key**. Get them in AWS Console: **IAM** → **Users** → your user (or create one with admin access) → **Security credentials** → **Create access key**. Use the same region you want for ECR (e.g. `us-east-1`).  
   *New account? See [Create an IAM user with admin access](#create-an-iam-user-with-admin-access-for-aws-configure) below.*

2. **Run the setup script** (creates ECR repo + IAM user + access key, prints values for GitHub):

   ```bash
   ./scripts/aws-ecr-setup.sh
   ```

   Defaults: region `us-east-1`, ECR repo name `pure`. Override: `./scripts/aws-ecr-setup.sh eu-west-1 my-repo`.

3. **Add the printed values in GitHub**: repo **Settings** → **Secrets and variables** → **Actions** → add the two secrets and the **AWS_ECR_ENABLED** variable as shown in the script output.

4. Push to `main` to trigger the first build.

---

## Manual setup (Console)

### 1. Create an AWS account

1. Go to [aws.amazon.com](https://aws.amazon.com) and choose **Create an AWS Account**.
2. Complete sign-up (email, password, payment method, identity check).
3. You get 12 months free tier; ECR has a small free allowance.

---

### Create an IAM user with admin access (for `aws configure`)

You **don’t need to create a group**. Attach the admin policy directly to the user.

1. In AWS Console, open **IAM** (search “IAM” in the top bar) → **Users** → **Create user**.
2. **User name:** e.g. `admin` (or your name). Click **Next**.
3. **Set permissions:** choose **Attach policies directly** (do not select “Add user to group”).
4. In the policy list, search for **AdministratorAccess**, check the box next to it, then **Next**.
5. **Create user**.
6. Open the new user → **Security credentials** tab → **Create access key**.
7. Use case: **Command Line Interface (CLI)** → **Next** → **Create access key**. Copy the **Access key ID** and **Secret access key** and use them in `aws configure`.

*If you prefer using a group:* IAM → **User groups** → **Create group** (e.g. `Admins`) → attach **AdministratorAccess** → create group → **Users** → Create user → on “Set permissions” choose **Add user to group** and select **Admins**. Then create the access key as above.

---

### 2. Create an ECR repository

1. In the AWS Console, open **ECR** (Elastic Container Registry): search "ECR" in the top search bar.
2. Choose **Create repository**.
3. **Repository name:** e.g. `pure` (or your GitHub repo name).
4. Leave other options default, then **Create repository**.
5. Note the **URI** (e.g. `123456789012.dkr.ecr.us-east-1.amazonaws.com/pure`) — you’ll use this to pull images later.

---

### 3. Create an IAM user for GitHub Actions

1. In the AWS Console, open **IAM** → **Users** → **Create user**.
2. **User name:** e.g. `github-actions-pure`.
3. **Next** → attach policy directly. Create or use a policy that allows ECR push.

**Option A – minimal policy (recommended)**  
Create a custom policy with this JSON (replace `123456789012` with your AWS account ID if you want to limit to one repo). If you use the S3 CDN sync (repo variable `AWS_S3_CDN_BUCKET`), add the S3 block below. If you use CloudFront in front of the bucket, add the CloudFront block so the workflow can invalidate the cache after each deploy (otherwise visitors may keep getting old CSS/JS):

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
        "ecr:CreateRepository",
        "ecr:DescribeRepositories"
      ],
      "Resource": "arn:aws:ecr:*:*:repository/*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::YOUR_CDN_BUCKET_NAME"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:DeleteObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::YOUR_CDN_BUCKET_NAME/*"
    },
    {
      "Effect": "Allow",
      "Action": ["cloudfront:CreateInvalidation", "cloudfront:GetInvalidation"],
      "Resource": "arn:aws:cloudfront::ACCOUNT_ID:distribution/E3HB60PWQLPD0R"
    },
    {
      "Effect": "Allow",
      "Action": ["apprunner:StartDeployment", "apprunner:DescribeService"],
      "Resource": "arn:aws:apprunner:REGION:ACCOUNT_ID:service/*"
    }
  ]
}
```

Replace `YOUR_CDN_BUCKET_NAME` with your S3 bucket name (e.g. `cdn.conjeezou.com`). For the CloudFront block, replace `ACCOUNT_ID` with your AWS account ID and `YOUR_DISTRIBUTION_ID` with your CloudFront distribution ID (AWS Console → CloudFront → your distribution → ID). For the App Runner block (needed only if you set `APP_RUNNER_SERVICE_ARN`), replace `REGION` and `ACCOUNT_ID` with your region and account ID.

If you prefer not to hardcode the distribution ID in the policy, use `"Resource": "arn:aws:cloudfront::ACCOUNT_ID:distribution/*"` so the user can invalidate any distribution in the account.

**Option B – use AWS managed policies**  
- **ECR:** Attach **AmazonEC2ContainerRegistryPowerUser** (simpler, but broader ECR access).
- **S3 CDN sync:** If you set the repo variable `AWS_S3_CDN_BUCKET`, attach **AmazonS3FullAccess** so the user can sync `dist/` to your bucket. This grants access to all S3 buckets in the account; for a single-bucket scope use the custom S3 block in Option A instead.
- **CloudFront invalidation:** If you set `AWS_CLOUDFRONT_DISTRIBUTION_ID`, the IAM user needs `cloudfront:CreateInvalidation` and `cloudfront:GetInvalidation`. Use the CloudFront block in Option A, or attach **CloudFrontFullAccess** (broader) so the workflow can invalidate the cache after each deploy.

4. **Next** → **Create user**.
5. Open the user → **Security credentials** → **Create access key**.
6. Choose **Application running outside AWS** (e.g. GitHub Actions) → **Next** → **Create access key**.
7. Copy the **Access key ID** and **Secret access key** and store them somewhere safe (you won’t see the secret again).

---

### 4. Add secrets in GitHub

1. In your repo: **Settings** → **Secrets and variables** → **Actions**.
2. **New repository secret**:
   - Name: `AWS_ACCESS_KEY_ID`  
     Value: the access key from step 3.
3. **New repository secret**:
   - Name: `AWS_SECRET_ACCESS_KEY`  
     Value: the secret key from step 3.

**Required variable** (under **Variables**):

- `AWS_ECR_ENABLED` = `true` — turns on the build-prod job. Leave unset until AWS is configured.

Optional variables:

- `AWS_REGION` — e.g. `us-east-1` (default in the workflow).
- `ECR_REPOSITORY` — ECR repo name (e.g. `pure`). If not set, the workflow uses the GitHub repo name.
- `AWS_S3_CDN_BUCKET` — S3 bucket name for the CDN (e.g. `cdn.conjeezou.com`). When set, the workflow syncs `dist/` to this bucket after each build.
- `AWS_CLOUDFRONT_DISTRIBUTION_ID` — CloudFront distribution ID for the CDN bucket. When set (together with `AWS_S3_CDN_BUCKET`), the workflow creates a cache invalidation after syncing to S3 so visitors get new CSS/JS immediately instead of cached old assets. Find the ID in AWS Console → CloudFront → your distribution.
- `APP_RUNNER_SERVICE_ARN` — Full ARN of your App Runner service (e.g. `arn:aws:apprunner:us-east-1:123456789012:service/pure/...`). When set, the workflow runs `aws apprunner start-deployment` after pushing the image so the service deploys the new ECR image. Get it with: `aws apprunner list-services --region us-east-1 --query 'ServiceSummaryList[?ServiceName==\`pure\`].ServiceArn' --output text`. **App Runner must use the same ECR region as the workflow (us-east-1).** If the service was created with us-east-2 ECR, see **docs/apprunner-ecr-us-east-1.md** to repoint it.

---

### 5. Verify and test

Check that secrets and variables are configured:

```bash
./scripts/check-github-ecr-config.sh
```

Requires [GitHub CLI](https://cli.github.com/) (`brew install gh`) and `gh auth login`. Run from repo root.

Then push a commit to `main`. The workflow **Build and Release to AWS ECR** should run, build the image, and push it to your ECR repository.

---

### Troubleshooting

**"The repository with name 'pure' does not exist in the registry"**

The ECR repository has not been created yet. Either:

1. **Create it in AWS Console:** ECR → **Create repository** → name `pure` (or whatever you set in `ECR_REPOSITORY`) → **Create repository**.
2. **Create it via CLI:** `aws ecr create-repository --repository-name pure --region us-east-1` (use your region if different).

The workflow now includes a step that creates the repository if it is missing (when the IAM user has `ecr:CreateRepository` permission).

---

**"Could not load credentials from any providers"**

This means `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are not set or are empty:

1. Go to **Settings** → **Secrets and variables** → **Actions**.
2. Ensure both `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` exist as **repository secrets** (not variables).
3. Secret names are case-sensitive and must match exactly.
4. If using organization secrets, ensure the repo has access under the org’s secret policies. You can pull it with:

```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
docker pull 123456789012.dkr.ecr.us-east-1.amazonaws.com/pure:latest
```

(Replace region and URI with yours.)
