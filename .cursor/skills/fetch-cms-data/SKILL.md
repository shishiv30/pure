# Fetch Data from Pure CMS

Guide for fetching data from the Pure CMS API system. Use when integrating CMS content into pages, components, or when working with CMS API endpoints.

## CMS Overview

The Pure CMS is located in `/cms/` directory and provides:
- **User Authentication**: Session-based auth with roles (admin/user)
- **Pages**: Content pages with name, title, content, meta fields
- **Sitemap**: URL entries with priority and change frequency
- **Users**: User management (admin only)

## Base URL

- **Development**: `http://localhost:3003`
- **Production**: `https://cms.conjee.com` (or configured domain)

## Public Endpoints (No Auth Required)

### Get Page Content by Name

**Endpoint**: `GET /api/pages/getPageContentByName?name=page-name`

```javascript
// Fetch published page content
async function getPageContent(pageName) {
	const response = await fetch(
		`http://localhost:3003/api/pages/getPageContentByName?name=${pageName}`
	);
	const result = await response.json();
	
	if (result.code === 200) {
		return result.data; // { name, title, content, meta_description, meta_keywords }
	}
	return null;
}

// Usage
const aboutPage = await getPageContent('about');
console.log(aboutPage.title); // "About Us"
console.log(aboutPage.content); // HTML content
```

**Alternative endpoint**: `GET /api/pages/content/:name`

```javascript
const response = await fetch('http://localhost:3003/api/pages/content/about');
```

### Get Active Sitemap Entries

**Endpoint**: `GET /api/sitemap/public`

```javascript
async function getSitemap() {
	const response = await fetch('http://localhost:3003/api/sitemap/public');
	const result = await response.json();
	return result.data; // Array of sitemap entries
}
```

## Authenticated Endpoints

### Authentication

**Login**: `POST /api/auth/login`

```javascript
async function login(email, password) {
	const response = await fetch('http://localhost:3003/api/auth/login', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		credentials: 'include', // Important for cookies
		body: JSON.stringify({ email, password })
	});
	return await response.json();
}
```

**Get Current User**: `GET /api/auth/me`

```javascript
async function getCurrentUser() {
	const response = await fetch('http://localhost:3003/api/auth/me', {
		credentials: 'include'
	});
	return await response.json();
}
```

### Pages (Authenticated)

**List Pages**: `GET /api/pages`
- **Admin**: Returns all pages (draft, published, archived)
- **User**: Returns only published pages
- **Requires**: Authentication

```javascript
async function getPages() {
	const response = await fetch('http://localhost:3003/api/pages', {
		credentials: 'include'
	});
	const result = await response.json();
	return result.data; // Array of pages
}
```

**Get Page by ID**: `GET /api/pages/:id`
- **Admin**: Can access any page
- **User**: Can only access published pages

```javascript
async function getPageById(id) {
	const response = await fetch(`http://localhost:3003/api/pages/${id}`, {
		credentials: 'include'
	});
	return await response.json();
}
```

**Create Page** (Admin only): `POST /api/pages`

```javascript
async function createPage(pageData) {
	const response = await fetch('http://localhost:3003/api/pages', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		credentials: 'include',
		body: JSON.stringify({
			name: 'page-name',
			title: 'Page Title',
			content: '<p>Content</p>',
			meta_description: 'SEO description',
			status: 'published' // 'draft', 'published', 'archived'
		})
	});
	return await response.json();
}
```

**Update Page** (Admin only): `PUT /api/pages/:id`

```javascript
async function updatePage(id, updates) {
	const response = await fetch(`http://localhost:3003/api/pages/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		credentials: 'include',
		body: JSON.stringify(updates)
	});
	return await response.json();
}
```

**Delete Page** (Admin only): `DELETE /api/pages/:id`

```javascript
async function deletePage(id) {
	const response = await fetch(`http://localhost:3003/api/pages/${id}`, {
		method: 'DELETE',
		credentials: 'include'
	});
	return await response.json();
}
```

### Sitemap (Authenticated)

**List Sitemap**: `GET /api/sitemap`
- **Admin**: Returns all entries (active and inactive)
- **User**: Returns only active entries

```javascript
async function getSitemapEntries() {
	const response = await fetch('http://localhost:3003/api/sitemap', {
		credentials: 'include'
	});
	const result = await response.json();
	return result.data;
}
```

### Users (Admin Only)

**List Users**: `GET /api/users`
- **Requires**: Admin role

```javascript
async function getUsers() {
	const response = await fetch('http://localhost:3003/api/users', {
		credentials: 'include'
	});
	const result = await response.json();
	return result.data;
}
```

## Response Format

All API responses follow this format:

```javascript
{
	code: 200,           // HTTP status code
	message: "Success",  // Human-readable message
	data: {}            // Response data (varies by endpoint)
}
```

## Error Handling

```javascript
async function fetchWithErrorHandling(url, options = {}) {
	try {
		const response = await fetch(url, {
			credentials: 'include',
			...options
		});
		const result = await response.json();
		
		if (result.code >= 400) {
			console.error(`API Error ${result.code}:`, result.message);
			return null;
		}
		
		return result.data;
	} catch (error) {
		console.error('Fetch error:', error);
		return null;
	}
}
```

## Common Error Codes

- `200` - Success
- `201` - Created successfully
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (insufficient permissions - e.g., user trying to access admin endpoints)
- `404` - Not Found
- `500` - Internal Server Error
- `503` - Service Unavailable (setup required)

## Role-Based Access

### Admin Role
- ✅ Full CRUD access to all pages (draft, published, archived)
- ✅ Full CRUD access to all sitemap entries (active, inactive)
- ✅ Full CRUD access to users table
- ✅ Can create, update, delete any content

### User Role
- ✅ Read-only access to published pages only
- ✅ Read-only access to active sitemap entries only
- ❌ Cannot access users table (`/api/users/*`)
- ❌ Cannot create, update, or delete content

### Public (No Auth)
- ✅ Can access published pages via public endpoints
- ✅ Can access active sitemap entries via public endpoint
- ❌ Cannot access authenticated endpoints

## Integration Examples

### Fetch Page Content in Component

```javascript
// In a Pure UI component
import { load } from '../core/load.js';

export default async function(pageName) {
	const pageData = await load(`http://localhost:3003/api/pages/getPageContentByName?name=${pageName}`);
	
	if (!pageData || pageData.code !== 200) {
		return '<p>Page not found</p>';
	}
	
	const { title, content } = pageData.data;
	return `
		<article>
			<h1>${title}</h1>
			<div>${content}</div>
		</article>
	`;
}
```

### Fetch Multiple Pages

```javascript
async function getPublishedPages() {
	const response = await fetch('http://localhost:3003/api/pages', {
		credentials: 'include'
	});
	const result = await response.json();
	
	if (result.code === 200) {
		return result.data.filter(page => page.status === 'published');
	}
	return [];
}
```

### Using in Server-Side Code

```javascript
// In server/configs/ or server routes
async function getPageContentByName(name) {
	const response = await fetch(`http://localhost:3003/api/pages/getPageContentByName?name=${name}`);
	const result = await response.json();
	return result.code === 200 ? result.data : null;
}

// Usage in config
export async function get(payload) {
	const pageContent = await getPageContentByName(payload.pageName);
	return {
		page: pageContent
	};
}
```

## Best Practices

1. **Always use `credentials: 'include'`** for authenticated requests to send cookies
2. **Check response codes** before accessing data
3. **Handle errors gracefully** - CMS might be unavailable
4. **Cache public content** when possible to reduce API calls
5. **Use public endpoints** when authentication isn't needed
6. **Respect role-based access** - don't try to access admin endpoints as a user

## Environment Configuration

The CMS base URL can be configured via environment variables:
- `CMS_API_URL` or `CMS_DOMAIN` in your application
- Default: `http://localhost:3003` (development)

## Notes

- CMS uses **session-based authentication** (cookies)
- Public endpoints only return **published/active** content
- Users cannot see draft or archived content
- Admin endpoints return `403 Forbidden` for non-admin users
- All endpoints return JSON with consistent `{code, message, data}` format
