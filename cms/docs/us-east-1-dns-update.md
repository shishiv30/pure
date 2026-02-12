# Final step: point cms.conjeezou.com to us-east-1

The full CMS stack is now running in **us-east-1**. To use it at **cms.conjeezou.com**, update DNS:

## Update your CNAME record

In the DNS provider for **conjeezou.com** (Route 53, Cloudflare, etc.):

- **Name:** `cms` (full name: cms.conjeezou.com)
- **Type:** CNAME
- **Value / Target:** `pure-cms-alb-1420427632.us-east-1.elb.amazonaws.com`

Save the record. After propagation (usually 1–5 minutes), both will work:

- **http://cms.conjeezou.com**
- **https://cms.conjeezou.com**

Open the site and create the first admin if this is a fresh DB (EFS in us-east-1 is new).

## Optional: redirect HTTP → HTTPS

In **EC2 → Load balancers → pure-cms-alb** (region **us-east-1**) → **Listeners**: edit the **HTTP : 80** listener and set the default action to **Redirect to** HTTPS, port 443, status code 301.

## Optional: clean up us-east-2

After you confirm the us-east-1 site works, you can delete the old resources in **us-east-2**: ECS service and cluster, ALB, EFS, and optionally the ECR repository and ACM certificate. See [migrate-cms-to-us-east-1.md](migrate-cms-to-us-east-1.md) section 4.
