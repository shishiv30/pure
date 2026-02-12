# App Runner: use us-east-1 ECR (same as CI)

The **Build Pure Web (prod)** workflow pushes the main-site image to **us-east-1** ECR (`178912016721.dkr.ecr.us-east-1.amazonaws.com/pure:latest`). If your App Runner service was created with **us-east-2** ECR, it will never see new images because `start-deployment` only redeploys from the **existing** source.

## One-time fix: point App Runner at us-east-1 ECR

1. **Get the service ARN and current access role**

   ```bash
   export APP_ARN=$(aws apprunner list-services --region us-east-1 --query 'ServiceSummaryList[?ServiceName==`pure`].ServiceArn' --output text)
   aws apprunner describe-service --service-arn "$APP_ARN" --region us-east-1 \
     --query 'Service.SourceConfiguration.ImageRepository.AuthenticationConfiguration.AccessRoleArn' --output text
   ```

   Copy the **AccessRoleArn** value (e.g. `arn:aws:iam::178912016721:role/AppRunnerECRAccessRole`).

2. **Update the service to use us-east-1 ECR**

   Replace `YOUR_ACCESS_ROLE_ARN` with the value from step 1. If your service uses a custom **Port** or **StartCommand**, add an `"ImageConfiguration": { "Port": "3000" }` (or your values) inside `"ImageRepository"` so they are preserved. Then run:

   ```bash
   aws apprunner update-service --service-arn "$APP_ARN" --region us-east-1 \
     --source-configuration '{
       "ImageRepository": {
         "ImageIdentifier": "178912016721.dkr.ecr.us-east-1.amazonaws.com/pure:latest",
         "ImageRepositoryType": "ECR",
         "AuthenticationConfiguration": {
           "AccessRoleArn": "YOUR_ACCESS_ROLE_ARN"
         }
       }
     }'
   ```

3. **Trigger a deployment** (or wait for the next CI run)

   ```bash
   aws apprunner start-deployment --service-arn "$APP_ARN" --region us-east-1
   ```

After this, the service pulls from us-east-1 ECR and future CI runs (with `APP_RUNNER_SERVICE_ARN` set) will deploy the new image correctly.
