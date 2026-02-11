# CMS Quick Start Guide

## Initial Setup

1. **Navigate to CMS directory**:
```bash
cd cms
```

2. **Install dependencies**:
```bash
npm install
```

3. **Configure environment**:
```bash
cp .env.example .env
# Edit .env and set SESSION_SECRET to a secure random string
```

4. **Start the server**:
```bash
npm run dev
```

The CMS will be available at `http://localhost:3003`

## First Time Setup

When you first access the CMS, you'll be prompted to create an admin account. Fill in:
- Email
- Name
- Password
- Phone (optional)

After creating the admin account, you'll be automatically logged in.

## Using the API

### Public Endpoints (No Auth Required)

**Get page content by name**:
```bash
curl http://localhost:3003/api/pages/getPageContentByName?name=about
```

**Get page content by name (path param)**:
```bash
curl http://localhost:3003/api/pages/content/about
```

**Get active sitemap entries**:
```bash
curl http://localhost:3003/api/sitemap/public
```

### Authentication

**Login**:
```bash
curl -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"yourpassword"}' \
  -c cookies.txt
```

**Get current user**:
```bash
curl http://localhost:3003/api/auth/me -b cookies.txt
```

**Logout**:
```bash
curl -X POST http://localhost:3003/api/auth/logout -b cookies.txt
```

### Admin Operations

**Create a page** (requires admin login):
```bash
curl -X POST http://localhost:3003/api/pages \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "about",
    "title": "About Us",
    "content": "<h1>About Us</h1><p>Welcome to our site!</p>",
    "meta_description": "Learn about our company",
    "status": "published"
  }'
```

**Update a page**:
```bash
curl -X PUT http://localhost:3003/api/pages/1 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "Updated About Us",
    "content": "<h1>Updated Content</h1>"
  }'
```

## Docker

### Build and Run Locally

```bash
# Build image
docker build -t pure-cms .

# Run container
docker run -d \
  -p 3003:3003 \
  -e NODE_ENV=production \
  -e PORT=3003 \
  -e SESSION_SECRET=your-secret-key \
  -v $(pwd)/data:/app/data \
  pure-cms
```

### Using Docker Compose

```bash
# Copy .env.example to .env and configure
cp .env.example .env

# Start services
docker-compose up -d

# View logs
docker-compose logs -f
```

## AWS ECR Deployment

1. **Set environment variables**:
```bash
export AWS_ACCOUNT_ID=your-account-id
export AWS_REGION=us-east-2
export ECR_REPOSITORY=pure-cms
```

2. **Create ECR repository** (if needed):
```bash
aws ecr create-repository --repository-name pure-cms --region us-east-2
```

3. **Deploy**:
```bash
./scripts/deploy-aws-ecr.sh production
```

4. **Run on ECS/EC2**:
```bash
docker run -d \
  -p 3003:3003 \
  -e NODE_ENV=production \
  -e PORT=3003 \
  -e SESSION_SECRET=your-secret \
  -e DB_PATH=/app/data/cms.db \
  -v cms-data:/app/data \
  ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/pure-cms:production
```

## Integration with cms.conjee.com

To integrate with your domain `cms.conjee.com`:

1. **Deploy to AWS ECR** (as above)

2. **Set up reverse proxy** (nginx example):
```nginx
server {
    listen 80;
    server_name cms.conjee.com;

    location / {
        proxy_pass http://localhost:3003;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

3. **Update CORS origins** in `.env`:
```
CORS_ORIGINS=https://cms.conjee.com,https://conjee.com
```

4. **Use HTTPS** (recommended):
- Set up SSL certificate (Let's Encrypt recommended)
- Update nginx config to use HTTPS
- Update `SESSION_SECRET` cookie to use `secure: true` in production

## Database

The CMS uses SQLite by default. The database file is stored at `./data/cms.db`.

To backup:
```bash
cp data/cms.db data/cms.db.backup
```

To migrate to PostgreSQL (future):
- Update `database/db.js` to use PostgreSQL client
- Update connection string in `.env`
- Run migration scripts

## Troubleshooting

**Port already in use**:
- Change `PORT` in `.env` to a different port (e.g., 3004)

**Database locked**:
- Ensure only one instance of the CMS is running
- Check file permissions on `data/cms.db`

**Session not persisting**:
- Check `SESSION_SECRET` is set in `.env`
- Ensure cookies are enabled in browser
- Check CORS configuration matches your domain

**Admin panel not loading**:
- Check browser console for errors
- Verify API endpoints are accessible
- Check CORS configuration
