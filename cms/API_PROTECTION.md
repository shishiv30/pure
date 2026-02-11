# API Protection Summary

This document outlines the role-based access control for all CMS API endpoints.

## Authentication Middleware

- `requireAuth` - Requires any authenticated user
- `requireAdmin` - Requires admin role
- `requireReadAccess` - Requires authentication (both admin and user roles)

## API Endpoints Protection

### Users API (`/api/users/*`)

**All endpoints require Admin role:**

| Method | Endpoint | Protection | Description |
|--------|----------|------------|-------------|
| GET | `/api/users` | `requireAdmin` | List all users (Admin only) |
| GET | `/api/users/:id` | `requireAdmin` | Get user by ID (Admin only) |
| POST | `/api/users` | `requireAdmin` | Create new user (Admin only) |
| PUT | `/api/users/:id` | `requireAdmin` | Update user (Admin only) |
| DELETE | `/api/users/:id` | `requireAdmin` | Delete user (Admin only) |

**Note:** Users with role `user` cannot access any user management endpoints. They will receive a `403 Forbidden` response.

### Pages API (`/api/pages/*`)

| Method | Endpoint | Protection | Admin | User | Public |
|--------|----------|------------|-------|------|--------|
| GET | `/api/pages/content/:name` | None | ✅ | ✅ | ✅ |
| GET | `/api/pages/getPageContentByName` | None | ✅ | ✅ | ✅ |
| GET | `/api/pages` | `requireReadAccess` | ✅ All | ✅ Published only | ❌ |
| GET | `/api/pages/:id` | `requireReadAccess` | ✅ All | ✅ Published only | ❌ |
| POST | `/api/pages` | `requireAdmin` | ✅ | ❌ | ❌ |
| PUT | `/api/pages/:id` | `requireAdmin` | ✅ | ❌ | ❌ |
| DELETE | `/api/pages/:id` | `requireAdmin` | ✅ | ❌ | ❌ |

**Access Rules:**
- **Public endpoints** (`/content/:name`, `/getPageContentByName`): No authentication required, but only returns published pages
- **Admin**: Full CRUD access to all pages (draft, published, archived)
- **User**: Read-only access to published pages only
- **Public**: Can only access published pages via public endpoints

### Sitemap API (`/api/sitemap/*`)

| Method | Endpoint | Protection | Admin | User | Public |
|--------|----------|------------|-------|------|--------|
| GET | `/api/sitemap/public` | None | ✅ | ✅ | ✅ |
| GET | `/api/sitemap` | `requireReadAccess` | ✅ All | ✅ Active only | ❌ |
| GET | `/api/sitemap/:id` | `requireReadAccess` | ✅ All | ✅ Active only | ❌ |
| POST | `/api/sitemap` | `requireAdmin` | ✅ | ❌ | ❌ |
| PUT | `/api/sitemap/:id` | `requireAdmin` | ✅ | ❌ | ❌ |
| DELETE | `/api/sitemap/:id` | `requireAdmin` | ✅ | ❌ | ❌ |

**Access Rules:**
- **Public endpoint** (`/public`): No authentication required, returns only active entries
- **Admin**: Full CRUD access to all sitemap entries (active and inactive)
- **User**: Read-only access to active entries only
- **Public**: Can only access active entries via public endpoint

### Authentication API (`/api/auth/*`)

| Method | Endpoint | Protection | Description |
|--------|----------|------------|-------------|
| POST | `/api/auth/login` | None | Login (creates session) |
| POST | `/api/auth/logout` | None | Logout (destroys session) |
| GET | `/api/auth/me` | None | Get current user info (checks session) |

### Setup API (`/api/setup/*`)

| Method | Endpoint | Protection | Description |
|--------|----------|------------|-------------|
| GET | `/api/setup/status` | None | Check if setup is complete |
| POST | `/api/setup/create-admin` | None | Create first admin (only works if no admin exists) |

## Response Codes

### Success Codes
- `200` - Success
- `201` - Created successfully

### Error Codes
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error
- `503` - Service Unavailable (setup required)

## Example API Calls

### Admin Accessing Users (✅ Allowed)
```bash
curl -X GET http://localhost:3003/api/users \
  -H "Cookie: connect.sid=..." \
  -b cookies.txt
# Returns: 200 OK with user list
```

### User Accessing Users (❌ Denied)
```bash
curl -X GET http://localhost:3003/api/users \
  -H "Cookie: connect.sid=..." \
  -b cookies.txt
# Returns: 403 Forbidden - "Admin access required"
```

### User Accessing Pages (✅ Read-only)
```bash
curl -X GET http://localhost:3003/api/pages \
  -H "Cookie: connect.sid=..." \
  -b cookies.txt
# Returns: 200 OK with published pages only
```

### User Creating Page (❌ Denied)
```bash
curl -X POST http://localhost:3003/api/pages \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=..." \
  -b cookies.txt \
  -d '{"name":"test","title":"Test"}'
# Returns: 403 Forbidden - "Admin access required"
```

### Public Accessing Page Content (✅ Allowed)
```bash
curl http://localhost:3003/api/pages/getPageContentByName?name=about
# Returns: 200 OK with page content (if published)
```

## Security Notes

1. **Session-based Authentication**: All protected endpoints use session cookies
2. **Role Checking**: Backend validates role on every request
3. **Data Filtering**: Users only see published/active content, admins see all
4. **No User Table Access**: Regular users cannot access `/api/users/*` endpoints at all
5. **Public Endpoints**: Only return published/active content, never draft or inactive

## Testing Protection

To test API protection:

1. **Login as Admin:**
```bash
curl -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"admin@example.com","password":"password"}'
```

2. **Test Admin Access:**
```bash
curl http://localhost:3003/api/users -b cookies.txt
# Should return 200 OK
```

3. **Login as User:**
```bash
curl -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies-user.txt \
  -d '{"email":"user@example.com","password":"password"}'
```

4. **Test User Access (Should Fail):**
```bash
curl http://localhost:3003/api/users -b cookies-user.txt
# Should return 403 Forbidden
```

5. **Test User Read Access (Should Succeed):**
```bash
curl http://localhost:3003/api/pages -b cookies-user.txt
# Should return 200 OK with published pages only
```
