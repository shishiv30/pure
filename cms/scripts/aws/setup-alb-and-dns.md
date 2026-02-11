# Link CMS to cms.conjeezou.com

To serve the CMS at **cms.conjeezou.com** (and keep a stable URL when the ECS task changes), use an **Application Load Balancer (ALB)** and point the domain to it.

## 1. Run the ALB setup script

From the `cms/` directory:

```bash
export AWS_PAGER=""
./scripts/aws/setup-alb.sh
```

This creates an ALB, a target group (port 3003), an HTTP listener, and updates the ECS service so tasks register with the ALB. At the end it prints the **ALB DNS name** (e.g. `pure-cms-alb-1234567890.us-east-2.elb.amazonaws.com`).

## 2. Point your domain to the ALB

In the DNS provider where **conjeezou.com** is managed (Route 53, Cloudflare, etc.):

- **Type:** `CNAME` (or alias if your provider supports it, e.g. Route 53 Alias)
- **Name:** `cms` (so the full name is `cms.conjeezou.com`)
- **Value / Target:** the ALB DNS name from step 1 (e.g. `pure-cms-alb-1234567890.us-east-2.elb.amazonaws.com`)

Save the record. DNS can take a few minutes to propagate.

## 3. Use HTTPS (optional)

- **Request a certificate** in AWS Certificate Manager (ACM) for `cms.conjeezou.com` (or `*.conjeezou.com`) in **us-east-2**.
- **Add an HTTPS listener** on the ALB (port 443) using that certificate, forwarding to the same target group. You can do this in the AWS Console: EC2 → Load Balancers → your `pure-cms-alb` → Listeners → Add listener (HTTPS, 443, your certificate, forward to the existing target group).
- Optionally **redirect HTTP → HTTPS** (add/update the HTTP listener to redirect to HTTPS).

## 4. Update CORS (if needed)

If the main site at conjeezou.com talks to the CMS API, set CORS to include your domain before or after linking:

```bash
export CORS_ORIGINS="https://cms.conjeezou.com,https://conjeezou.com"
# Then redeploy or update the task definition and run a new deployment.
```

After DNS and (if you use it) HTTPS are in place, open **https://cms.conjeezou.com** (or http:// until HTTPS is set up).
