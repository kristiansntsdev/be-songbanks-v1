# Development Best Practices

## Controllers

### Structure and Organization
- Use static methods for controller actions
- Follow RESTful naming conventions: `index`, `show`, `create`, `update`, `destroy`
- Always wrap controller methods in try-catch blocks
- Use centralized error handling via `ErrorController.handleError()`

### Error Handling
```javascript
static async methodName(req, res) {
    try {
        // Your logic here
        res.json({ message: 'Success' });
    } catch (error) {
        ErrorController.handleError(error, req, res);
    }
}
```

### HTTP Status Codes
- `200` - Success for GET, PUT, DELETE
- `201` - Success for POST (resource created)
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

### Response Format
Maintain consistent response structure:
```javascript
{
    code: 200,
    message: "Success message",
    data: {} // or []
}
```

## Models

### Database Schema
- Use ULID for primary keys: `defaultValue: () => ulid()`
- Set appropriate data types and constraints
- Use `allowNull: false` for required fields
- Define foreign key relationships with `references`

### Model Structure
```javascript
const ModelName = sequelize.define('table_name', {
    id: {
        type: DataTypes.STRING(26),
        primaryKey: true,
        allowNull: false,
        defaultValue: () => ulid()
    },
    // Other fields...
}, {
    indexes: [
        // Add performance indexes
        {
            fields: ['frequently_queried_field']
        }
    ]
});
```

### Common Issues to Avoid
- Fix typos in `references` (not `refferences`)
- Ensure model names match table names correctly
- Use proper ENUM values for status fields
- Set appropriate default values

## API Routes (routes/api.js)

### Route Organization
- Group related routes together
- Use middleware for authentication: `authenticateToken`
- Apply consistent route naming patterns

### Swagger Documentation
- Document all API endpoints with comprehensive Swagger comments
- Include request/response schemas
- Specify security requirements for protected routes
- Provide example payloads

### Route Structure
```javascript
/**
 * @swagger
 * /api/endpoint:
 *   method:
 *     summary: Brief description
 *     description: Detailed description
 *     tags: [TagName]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success response
 */
router.method('/endpoint', middleware, Controller.method);
```

### Security Best Practices
- Always use `authenticateToken` for protected routes
- Validate user permissions in controller methods
- Sanitize and validate all input data
- Use proper HTTP methods (GET, POST, PUT, DELETE)

### Error Response Schema
Use consistent error response format:
```javascript
{
    code: 400,
    message: "Error description",
    error: "Detailed error info"
}
```

## General Guidelines

### Code Quality
- Use consistent indentation (tabs/spaces)
- Follow JavaScript naming conventions
- Write descriptive variable and function names
- Add comments for complex business logic

### Performance
- Add database indexes for frequently queried fields
- Use pagination for large datasets
- Implement proper caching strategies
- Optimize database queries

### Testing
- Write unit tests for models
- Test API endpoints with various scenarios
- Test error handling paths
- Validate authentication and authorization

### Documentation
- Keep Swagger documentation up to date
- Document complex business logic
- Maintain clear commit messages
- Update ERD when database changes occur