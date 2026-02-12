# Fix www.conjeezou.com → App Runner

**www.conjeezou.com** is linked to your App Runner service (`https://qis7miipe5.us-east-1.awsapprunner.com/`).

**Done:** The DNS records below have been added to your **Route 53** hosted zone for conjeezou.com. If you use a different DNS provider, add them there instead (and remove or ignore any duplicate records in Route 53).

## 1. Traffic: point www to App Runner

Add **one** of these (depending on how your DNS provider expects the name):

| Type  | Name | Value / Target |
|-------|------|----------------|
| CNAME | `www` | `qis7miipe5.us-east-1.awsapprunner.com` |

So the full hostname **www.conjeezou.com** resolves to the App Runner URL above.

## 2. Certificate validation (required for HTTPS on www.conjeezou.com)

App Runner needs these CNAME records to issue the SSL certificate. Add all three:

| Type  | Name | Value / Target |
|-------|------|----------------|
| CNAME | `_eece8a6ab350dc5758aaf19f190b2130.www` | `_4efac603a7da8f774d893f2a4b868e19.jkddzztszm.acm-validations.aws.` |
| CNAME | `_ee8c4bfbb643dfbe1a006345fd2a6c05.www.www` | `_ffd96bbd47e72e8a4494e2727003662f.jkddzztszm.acm-validations.aws.` |
| CNAME | `_c1cb9861bbb663ac9a3f32c1415e8dc2.tntx1tq6gqckrigw4dd8ihdo6dm6nah.www` | `_4ce91007beca425ffa98033ecc085aa3.jkddzztszm.acm-validations.aws.` |

**Note:** Some providers want the **Name** without the domain (e.g. `_eece8a6ab350dc5758aaf19f190b2130.www` for record name, and they append `conjeezou.com`). Others want the full name including `conjeezou.com` (e.g. `_eece8a6ab350dc5758aaf19f190b2130.www.conjeezou.com`). Use the format your provider expects.

## 3. After adding the records

- Propagation can take a few minutes up to 48 hours.
- In **AWS Console → App Runner → Services → pure → Custom domains**, the domain status will change from **Pending certificate DNS validation** to **Active** once validation succeeds.
- Then open **https://www.conjeezou.com** — it should load your App Runner app.

## If you use Route 53

You can instead use the App Runner console: **Custom domains** tab → **Link domain** → choose **Amazon Route 53** and select the domain. App Runner can create the records for you automatically.
