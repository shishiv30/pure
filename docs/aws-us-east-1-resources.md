# AWS us-east-1 resources (list with descriptions)

Inventory of resources in **us-east-1** (N. Virginia) as of the last check.

---

## ECS (Elastic Container Service)

| Resource | ID/Name | Description |
|----------|---------|-------------|
| **Cluster** | `pure-cms-cluster` | ECS cluster for the Pure CMS app. Status: ACTIVE. |
| **Service** | `pure-cms-service` | Fargate service running 1 task; runs the CMS container, uses EFS for DB. |

---

## EC2 / VPC

| Resource | ID/Name | Description |
|----------|---------|-------------|
| **VPC** | `vpc-01d934d8fd656bc6a` | Default VPC, CIDR 172.31.0.0/16. |
| **Subnets** | 6 subnets | One per AZ (us-east-1a–f): `subnet-02bce7ff50a02cab8` (1a), `subnet-016682adac17959cc` (1b), `subnet-0fe90e1790be57302` (1c), `subnet-0086a16c141c42132` (1d), `subnet-0fd3b664f5c14511e` (1e), `subnet-03fc6be8d82ed2301` (1f). |
| **Security groups** | `pure-cms-ecs-sg` (sg-049972a0c57ae1c8a) | Used by ECS tasks; allows inbound 3003. |
| | `pure-cms-alb-sg` (sg-08e7f2ca7d234bde9) | Used by the CMS ALB; allows 80, 443. |
| | `pure-cms-efs-sg` (sg-0a2e58a7add3a8a99) | Used by EFS mount targets; allows NFS (2049) from ECS SG. |
| | `default` (sg-0a3600c900a4032bb) | Default VPC security group. |
| **Elastic IPs** | 2 | `eipalloc-04cdd6056690eae52` (100.28.44.234), `eipalloc-0c20f6f7b573520a7` (44.217.192.128). May be unassociated or used by other resources. |

---

## Load balancing

| Resource | ID/Name | Description |
|----------|---------|-------------|
| **ALB** | `pure-cms-alb` | Application Load Balancer for CMS. DNS: `pure-cms-alb-1420427632.us-east-1.elb.amazonaws.com`. HTTP 80 + HTTPS 443, internet-facing. |
| **Target group** | `pure-cms-tg` | Forwards to CMS container on port 3003 (HTTP). Used by the ALB. |

---

## Storage

| Resource | ID/Name | Description |
|----------|---------|-------------|
| **EFS** | `fs-06f8b66a4118ec000` (Name: pure-cms-data) | Elastic File System for CMS SQLite DB; mounted at `/app/data` in the ECS task. State: available. |

---

## Container registry

| Resource | ID/Name | Description |
|----------|---------|-------------|
| **ECR repository** | `pure-cms` | Docker image repo for CMS. URI: `178912016721.dkr.ecr.us-east-1.amazonaws.com/pure-cms`. |

---

## Certificates (ACM)

| Resource | Domain | Description |
|----------|--------|-------------|
| **Certificate** | conjeezou.com | Public cert (e.g. root or www). Status: ISSUED. |
| **Certificate** | cdn.conjeezou.com | For CDN/CloudFront. Status: ISSUED. |
| **Certificate** | cms.conjeezou.com | For CMS ALB HTTPS. Status: ISSUED. |

---

## Observability

| Resource | ID/Name | Description |
|----------|---------|-------------|
| **Log group** | `/ecs/pure-cms` | CloudWatch Logs for the CMS ECS task (stdout/stderr). |

---

## App Runner

| Resource | ID/Name | Description |
|----------|---------|-------------|
| **Service** | `pure` | App Runner service for the main site. URL: `https://qis7miipe5.us-east-1.awsapprunner.com`. Custom domain: www.conjeezou.com. |

---

## Other services (empty in us-east-1)

- **Lambda** – No functions.
- **RDS** – No DB instances.

---

## IAM (account-level, used by us-east-1)

| Resource | Description |
|----------|-------------|
| **ecsTaskExecutionRole-pure-cms** | Role used by ECS to pull images from ECR, write logs, and mount EFS for the CMS task. |

---

## Summary

- **CMS stack:** ECS cluster + service, ALB, target group, EFS, ECR, ACM (cms.conjeezou.com), security groups, CloudWatch log group.
- **Main site:** App Runner service `pure` (www.conjeezou.com).
- **Shared:** Default VPC, subnets, 2 Elastic IPs, ACM certs for conjeezou.com and cdn.conjeezou.com.
