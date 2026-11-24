# API Testing Guide

## Prerequisites
1. Supabase database connected: `host=db.bliqretbhgypabatqogr.supabase.co` (no local PostgreSQL needed)
2. Backend server running on port **5100**: `dotnet run`
3. Frontend served from `Frontend/` directory (open `index.html` in browser or use Live Server)

---

## Authentication Flow

### 1. Register a New User (Optional - Admin already seeded)
```http
POST http://localhost:5100/api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "User@123456",
  "fullName": "John Doe"
}
```

### 2. Login (Get Access Token)
```http
POST http://localhost:5100/api/auth/login
Content-Type: application/json

{
  "email": "admin@portfolio.com",
  "password": "Admin@123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "7a5f3e2d-1b4c-...",
    "expiresIn": 900
  }
}
```

### 3. Use Access Token for Protected Endpoints
Add this header to all admin requests:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### 4. Refresh Token (When Access Token Expires)
```http
POST http://localhost:5100/api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "7a5f3e2d-1b4c-..."
}
```

---

## Public API Examples (No Auth Required)

### Get Active Hero Section
```http
GET http://localhost:5100/api/herosection/active
```

### Get All Projects
```http
GET http://localhost:5100/api/projects
```

### Get Featured Projects
```http
GET http://localhost:5100/api/projects/featured
```

### Get Skills by Category
```http
GET http://localhost:5100/api/skills/by-category
```

### Submit Contact Form
```http
POST http://localhost:5100/api/contactmessages
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Project Inquiry",
  "message": "I would like to discuss a project..."
}
```

### Get Site Settings
```http
GET http://localhost:5100/api/sitesettings/dictionary
```

---

## Admin API Examples (Requires Auth Token)

### Create a New Project
```http
POST http://localhost:5100/api/projects
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "title": "E-Commerce Platform",
  "description": "A full-featured online shopping platform",
  "imageUrl": "https://example.com/images/ecommerce.jpg",
  "projectUrl": "https://shop.example.com",
  "githubUrl": "https://github.com/user/ecommerce",
  "technologies": "ASP.NET Core, React, PostgreSQL, Redis",
  "order": 1,
  "isFeatured": true,
  "categoryTag": "Full Stack"
}
```

### Update a Project
```http
PUT http://localhost:5100/api/projects/{project-id}
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "title": "E-Commerce Platform v2",
  "description": "Updated description...",
  "imageUrl": "https://example.com/images/ecommerce-v2.jpg",
  "projectUrl": "https://shop.example.com",
  "githubUrl": "https://github.com/user/ecommerce",
  "technologies": "ASP.NET Core, React, PostgreSQL, Redis",
  "order": 1,
  "isFeatured": true,
  "categoryTag": "Full Stack"
}
```

### Delete a Project (Soft Delete)
```http
DELETE http://localhost:5100/api/projects/{project-id}
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Create a Skill
```http
POST http://localhost:5100/api/skills
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "name": "C#",
  "category": "Backend",
  "proficiencyPercentage": 95,
  "icon": "devicon-csharp-plain",
  "order": 1
}
```

### Create Experience
```http
POST http://localhost:5100/api/experience
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "companyName": "Tech Corp",
  "role": "Senior Software Engineer",
  "location": "Remote",
  "description": "Led development of microservices architecture...",
  "startDate": "2020-01-15T00:00:00Z",
  "endDate": null,
  "isCurrent": true,
  "order": 1
}
```

### Get Unread Messages Count
```http
GET http://localhost:5100/api/contactmessages/unread-count
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Mark Message as Read
```http
PATCH http://localhost:5100/api/contactmessages/{message-id}
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "isRead": true
}
```

---

## Testing with Swagger UI

1. Run the backend: `dotnet run`
2. Open browser: `https://localhost:7xxx/swagger`
3. Click "Authorize" button (top right)
4. Login via `/api/auth/login` endpoint
5. Copy the `accessToken` from response
6. Click "Authorize" button again
7. Enter: `Bearer YOUR_ACCESS_TOKEN`
8. Click "Authorize"
9. Now you can test all protected endpoints!

---

## Testing with VS Code REST Client

Create a file `test.http` in your project:

```http
### Variables
@baseUrl = http://localhost:5100
@token = YOUR_ACCESS_TOKEN_HERE

### Login
# @name login
POST {{baseUrl}}/api/auth/login
Content-Type: application/json

{
  "email": "admin@portfolio.com",
  "password": "Admin@123456"
}

### Get All Projects (Public)
GET {{baseUrl}}/api/projects

### Create Project (Admin)
POST {{baseUrl}}/api/projects
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "title": "My Awesome Project",
  "description": "A great project description",
  "imageUrl": "https://example.com/image.jpg",
  "technologies": "C#, .NET, PostgreSQL",
  "order": 1,
  "isFeatured": true
}
```

---

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "title": "My Project",
    ...
  },
  "errors": null
}
```

### Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "errors": [
    "Title is required",
    "Description must be at least 10 characters"
  ]
}
```

### Not Found Response
```json
{
  "success": false,
  "message": "Project not found",
  "data": null,
  "errors": ["Project not found"]
}
```

---

## Tips for Testing

1. **Token Expiry**: Access tokens expire in 15 minutes. Use refresh token to get a new one.
2. **Soft Delete**: Deleted items are not permanently removed, just marked as deleted.
3. **Ordering**: Use the `order` field to control display sequence (lower = higher priority).
4. **UUID Format**: All IDs are GUIDs in format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
5. **UTC Dates**: All dates are stored and returned in UTC format.

---

## Troubleshooting

### 401 Unauthorized
- Token expired - use refresh token endpoint
- Token missing - add Authorization header
- Invalid token - login again

### 404 Not Found
- Wrong endpoint URL
- Resource doesn't exist
- Resource was soft deleted

### 500 Internal Server Error
- Check server logs
- Database connection issues
- Validation errors

---

## Next Steps

After testing the API:
1. Build the frontend to consume these endpoints
2. Implement proper error handling in frontend
3. Add loading states for API calls
4. Implement token refresh logic
5. Add form validation matching backend rules
