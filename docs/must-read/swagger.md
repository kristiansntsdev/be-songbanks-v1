# Swagger Documentation Guide

## Overview

This project uses Swagger UI for API documentation. Swagger provides an interactive interface to test and explore API endpoints.

## Accessing Swagger UI

- **URL**: `http://localhost:3000/api-docs`
- **Requirements**: Server must be running (`npm start`)

## Configuration

### Main Configuration (`config/swagger.js`)

```javascript
const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Songbanks API",
      version: "1.0.0",
      description: "API documentation for Songbanks application",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./routes/*.js", "./app/controllers/*.js"],
};

const specs = swaggerJSDoc(options);
module.exports = specs;
```

## Adding API Documentation

### 1. Schema Definitions

Define reusable schemas at the top of your route file:

```javascript
/**
 * @swagger
 * components:
 *   schemas:
 *     Post:
 *       type: object
 *       required:
 *         - title
 *         - content
 *       properties:
 *         id:
 *           type: string
 *           description: The post's ULID
 *         title:
 *           type: string
 *           description: The post title
 *         content:
 *           type: string
 *           description: The post content
 *         userId:
 *           type: string
 *           description: The author's ULID
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         id: 01HXXXXXXXXXXXXXXXXXXXXXXX
 *         title: My First Post
 *         content: This is the content of my first post
 *         userId: 01HXXXXXXXXXXXXXXXXXXXXXXX
 *         createdAt: 2023-01-01T00:00:00.000Z
 *         updatedAt: 2023-01-01T00:00:00.000Z
 */
```

### 2. Public Endpoints

For endpoints that don't require authentication:

```javascript
/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *             example:
 *               email: admin-test@gmail.com
 *               password: admin
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *               example:
 *                 token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   id: 01HXXXXXXXXXXXXXXXXXXXXXXX
 *                   email: admin-test@gmail.com
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
```

### 3. Protected Endpoints

For endpoints that require authentication:

```javascript
/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Get all posts
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *             example:
 *               title: My New Post
 *               content: This is the content of my new post
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
```

### 4. Error Schema

Define a common error schema:

```javascript
/**
 * @swagger
 * components:
 *   schemas:
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Error type
 *         message:
 *           type: string
 *           description: Error message
 *         statusCode:
 *           type: integer
 *           description: HTTP status code
 *       example:
 *         error: Bad Request
 *         message: Title and content are required
 *         statusCode: 400
 */
```

## Testing with Swagger UI

### 1. Authentication

1. **Login**: Use the `/api/login` endpoint with credentials
2. **Copy Token**: Copy the JWT token from the response
3. **Authorize**: Click the "Authorize" button (lock icon) in the top right
4. **Enter Token**: Paste the token and click "Authorize"

### 2. Testing Endpoints

1. **Expand Endpoint**: Click on the endpoint you want to test
2. **Try It Out**: Click the "Try it out" button
3. **Fill Parameters**: Enter required parameters and request body
4. **Execute**: Click "Execute" to make the request
5. **View Response**: Check the response body and status code

### 3. Common Response Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request (validation error)
- **401**: Unauthorized (invalid/missing token)
- **404**: Not Found
- **500**: Internal Server Error

## Best Practices

### 1. Documentation Structure

- Use clear, descriptive summaries
- Group related endpoints with tags
- Provide complete examples
- Document all possible responses

### 2. Schema Management

- Define reusable schemas in components
- Use `$ref` to reference schemas
- Keep schemas DRY (Don't Repeat Yourself)

### 3. Security Documentation

- Always specify `security` for protected endpoints
- Document authentication requirements
- Explain token format and usage

### 4. Examples

- Provide realistic examples
- Include both success and error scenarios
- Use actual data formats

## Updating Documentation

1. **Edit Route Files**: Update Swagger comments in `routes/*.js`
2. **Restart Server**: Changes require server restart
3. **Refresh Browser**: Hard refresh the Swagger UI page
4. **Test Changes**: Verify documentation displays correctly

## Common Issues

### 1. Changes Not Showing

- **Solution**: Restart the server and hard refresh browser

### 2. Syntax Errors

- **Solution**: Validate YAML syntax in Swagger comments
- **Tool**: Use online YAML validators

### 3. Schema References Not Working

- **Solution**: Ensure schemas are defined in components section
- **Check**: Verify correct `$ref` syntax

### 4. Authentication Not Working

- **Solution**: Verify `bearerAuth` is defined in security schemes
- **Check**: Ensure endpoints have `security: - bearerAuth: []`
