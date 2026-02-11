# Pure CMS

Content Management System for Pure UI Framework with authentication and role-based access control.

## Features

- **User Authentication**: Login/logout with session management
- **Role-Based Access Control**: Two roles - `user` and `admin`
- **Database**: SQLite database with tables for users, pages, and sitemap
- **RESTful API**: Full CRUD operations for all resources
- **Admin Setup**: First-time admin user creation flow
- **Docker Support**: Ready for containerization and AWS ECR deployment

## Database Schema

### Users Table
- `id` (INTEGER PRIMARY KEY)
- `email` (TEXT UNIQUE)
- `name` (TEXT)
- `password` (TEXT - bcrypt hashed)
- `phone` (TEXT)
- `role` (TEXT - 'user' or 'admin')
- `created_at` (DATETIME)
- `updated_at` (DATETIME)

### Pages Table
- `id` (INTEGER PRIMARY KEY)
- `name` (TEXT UNIQUE)
- `title` (TEXT)
- `content` (TEXT)
- `meta_description` (TEXT)
- `meta_keywords` (TEXT)
- `status` (TEXT - 'draft', 'published', 'archived')
- `created_by` (INTEGER - FK to users)
- `updated_by` (INTEGER - FK to users)
- `created_at` (DATETIME)
- `updated_at` (DATETIME)

### Sitemap Table
- `id` (INTEGER PRIMARY KEY)
- `url` (TEXT)
- `priority` (REAL - 0.0 to 1.0)
- `changefreq` (TEXT - 'always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never')
- `lastmod` (DATETIME)
- `status` (TEXT - 'active', 'inactive')
- `created_at` (DATETIME)
- `updated_at` (DATETIME)

## Setup

1. **Install dependencies**:
```bash
cd cms
npm install
```

2. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start development server**:
```bash
npm run dev
```

4. **Create admin user** (first time only):
```bash
curl -X POST http://localhost:3003/api/setup/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "name": "Admin User",
    "password": "securepassword",
    "phone": "+1234567890"
  }'
```

## API Endpoints

### Public Endpoints

- `GET /health` - Health check
- `GET /api/setup/status` - Check if setup is complete
- `POST /api/setup/create-admin` - Create first admin user
- `GET /api/pages/content/:name` - Get published page content by name
- `GET /api/pages/getPageContentByName?name=page-name` - Get published page content by name (query param)
- `GET /api/sitemap/public` - Get active sitemap entries

### Authentication Endpoints

- `POST /api/auth/login` - Login
  ```json
  {
    "email": "user@example.com",
    "password": "password"
  }
  ```
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user info

### Pages Endpoints (Requires Auth)

- `GET /api/pages` - List all pages (admin) or published pages (user)
- `GET /api/pages/:id` - Get page by ID
- `POST /api/pages` - Create page (admin only)
- `PUT /api/pages/:id` - Update page (admin only)
- `DELETE /api/pages/:id` - Delete page (admin only)

### Sitemap Endpoints (Requires Auth)

- `GET /api/sitemap` - List all entries (admin) or active entries (user)
- `GET /api/sitemap/:id` - Get entry by ID
- `POST /api/sitemap` - Create entry (admin only)
- `PUT /api/sitemap/:id` - Update entry (admin only)
- `DELETE /api/sitemap/:id` - Delete entry (admin only)

### Users Endpoints (Admin Only)

- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Access Control

- **Admin**: Full read/write access to all tables
- **User**: Read-only access to pages and sitemap (published/active only), cannot access users table

## Docker

### Build and Run Locally

```bash
# Development
docker-compose up --build

# Production
DOCKER_BUILD_TARGET=production docker-compose up --build
```

### Build Docker Image

```bash
npm run build-docker
# or
docker build -t pure-cms .
```

## AWS ECR Deployment

1. **Configure AWS credentials**:
```bash
export AWS_ACCOUNT_ID=your-account-id
export AWS_REGION=us-east-2
export ECR_REPOSITORY=pure-cms
```

2. **Create ECR repository** (if not exists):
```bash
aws ecr create-repository --repository-name pure-cms --region us-east-2
```

3. **Deploy**:
```bash
chmod +x scripts/deploy-aws-ecr.sh
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
  ${ECR_REGISTRY}/pure-cms:production
```

### GitHub Actions (build-cms-prd)

The workflow **Build CMS (prod)** (`.github/workflows/build-cms-prd.yml`) runs only when commits touch the **cms/** folder. It builds the CMS Docker image and pushes it to ECR; it does not run or restart any container on AWS.

- **Trigger**: Push to `main` with changes under `cms/**`
- **Condition**: Runs only if repo variable `AWS_ECR_ENABLED` is `true` (same as main ECR workflow)
- **Secrets**: Uses `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
- **Variables**: `AWS_REGION` (default `us-east-2`), `ECR_REPOSITORY_CMS` (default `pure-cms`)

After the workflow runs, pull the new image on your AWS instance and restart the container. Data is preserved as long as you use a persistent volume for the database (see below).

### Data preservation on AWS

The workflow **does not modify or replace your database**. It only builds and pushes a new image. To avoid losing data when you deploy a new image:

1. **Use a persistent volume for the database**  
   Mount a volume at `/app/data` (or whatever `DB_PATH` points to) so the SQLite file lives on the host or an EBS/EFS volume, not inside the container.

2. **Example (Docker)**  
   `-v cms-data:/app/data` or `-v /host/path/cms-data:/app/data` keeps the DB across container restarts and image updates.

3. **Example (ECS)**  
   Use a task definition with a volume (e.g. EFS or EBS) mounted at `/app/data` and set `DB_PATH=/app/data/cms.db`. When you deploy a new task revision with the updated image, attach the same volume so the existing database is reused.

## Environment Variables

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3003)
- `DOMAIN` - Domain name
- `SESSION_SECRET` - Session secret key (required)
- `DB_PATH` - Database file path (default: ./data/cms.db)
- `CORS_ORIGINS` - Comma-separated list of allowed CORS origins

## License

ISC
