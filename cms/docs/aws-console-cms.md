# Where to find the CMS in the AWS Console

## ECS cluster and service

1. Open **AWS Console** → **ECS** (Elastic Container Service).
2. In the left sidebar, click **Clusters**.
3. Click **pure-cms-cluster** (or the cluster name you used).
4. You’ll see:
   - **Services** tab: click **pure-cms-service** to see desired/running count, events, and the load balancer (if you ran `setup-alb.sh`).
   - **Tasks** tab: lists running and stopped tasks. Click a task to see status, last status (reason if stopped), and logs link.

**Direct link (replace region if needed):**  
`https://us-east-1.console.aws.amazon.com/ecs/v2/clusters/pure-cms-cluster/services/pure-cms-service`

## If you use an ALB

- **EC2** → **Load Balancers** → **pure-cms-alb**: see DNS name and listeners.
- **EC2** → **Target Groups** → **pure-cms-tg**: see targets and their health (Healthy / Unhealthy). If targets are unhealthy, the ALB returns 503.

## Why you might not be able to visit after a new image

1. **GitHub Actions only pushes the image** – It does not deploy to ECS. The running task keeps the previous image until you run a new deployment.
2. **Public IP changes on new tasks** – If you visit by `http://<public-ip>:3003`, that IP is valid only for the current task. After a new deployment (or if the task restarts), the IP changes. Use **`./cms/scripts/aws/get-cms-url.sh`** to get the current URL, or use the **ALB** and **cms.conjeezou.com** so the URL stays the same.
3. **No running task** – Check the **Tasks** tab: if there are 0 running tasks, look at **Stopped tasks** and open one to see **Stopped reason** and **Containers** (exit code). Check the **Services** tab **Events** for messages like “service has reached a steady state” or “unable to place a task”.
4. **New task failing** – If you ran a deployment after the latest push, the new task might be failing health checks or crashing. In **Target Groups** → **pure-cms-tg** → **Targets**, unhealthy targets mean the ALB won’t route to them. Fix the app or image, then redeploy.

## Deploy the latest image after a GitHub Actions build

From your machine (with AWS CLI and same region):

```bash
export AWS_PAGER=""
aws ecs update-service \
  --cluster pure-cms-cluster \
  --service pure-cms-service \
  --force-new-deployment \
  --region us-east-1
```

Then either:

- Get the new public IP: `./cms/scripts/aws/get-cms-url.sh`, or  
- Use the ALB URL (e.g. **http://cms.conjeezou.com** if DNS is set up).
