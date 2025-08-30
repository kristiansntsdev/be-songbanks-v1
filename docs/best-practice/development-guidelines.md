# Development Best Practices

## Development Flow

Follow this proven workflow pattern established in the codebase (see Song implementation as reference):

### 1. Model Layer (`app/models/`) - Skip if already exists
- Define model with BaseModel extension
- Set `fillable`, `hidden`, and `casts` properties
- Define associations with other models
- Use ModelFactory.register() with sequelize configuration

### 2. Service Layer (`app/services/`)
- Create service class with static methods
- Implement business logic and database operations
- Use transactions for multi-step operations with proper rollback
- Throw errors with statusCode property for controller handling
- Handle data validation and transformation

### 3. Controller Layer (`app/controllers/`)
- Add comprehensive JSDoc comments with Swagger annotations
- Use ErrorHandler.asyncHandler wrapper for all methods  
- Follow RESTful naming: `getAllX`, `getXById`, `createX`, `updateX`, `deleteX`
- Reference request/response schemas in JSDoc
- Maintain consistent response format

### 4. Schema Layer (`schemas/`)
- Create request schemas in `schemas/requests/`
- Create response schemas in `schemas/responses/`
- Use OpenAPI format with examples and descriptions
- Reference common schemas for consistency

### 5. Build Process
- Run `npm run build` to generate API documentation and lint
- Test with `npm run vercel-build` before deployment

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

## Services

### Service Layer Structure

Services contain business logic and handle database operations:

```javascript
class ResourceService {
  static async getAllResources(options = {}) {
    // Handle pagination, filtering, sorting
    // Use raw SQL for complex queries when needed
    // Return structured data with pagination info
  }

  static async getResourceById(id) {
    // Single resource retrieval
    // Throw error with statusCode if not found
    const error = new Error("Resource not found");
    error.statusCode = 404;
    throw error;
  }

  static async createResource(data) {
    // Use transactions for multi-step operations
    // Validate required fields before processing
    // Handle related data (tags, associations)
  }
}
```

### Transaction Handling

Always use transactions for operations involving multiple database changes:

```javascript
static async createResource(resourceData) {
  const transaction = await Model.sequelize.transaction();
  
  try {
    // Multi-step database operations
    const resource = await Model.create(resourceData, { transaction });
    
    // Handle related data within transaction
    await RelatedModel.bulkCreate(relatedData, { transaction });
    
    await transaction.commit();
    return resource;
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    throw error;
  }
}
```

### Error Handling in Services

- Throw errors with statusCode property for consistent controller handling
- Validate required data at service level
- Use descriptive error messages
- Handle database constraint violations appropriately

```javascript
if (!data.required_field) {
  const error = new Error("Required field is missing");
  error.statusCode = 400;
  throw error;
}
```

### Query Optimization

- Use raw SQL for complex queries with joins
- Implement proper pagination
- Add database indexes for frequently queried fields
- Load related data efficiently to avoid N+1 queries

## Models

### Database Schema

- Use ULID for primary keys: `defaultValue: () => ulid()`
- Set appropriate data types and constraints
- Use `allowNull: false` for required fields
- Define foreign key relationships with `references`

### Model Structure

```javascript
const ModelName = sequelize.define(
  "table_name",
  {
    id: {
      type: DataTypes.STRING(26),
      primaryKey: true,
      allowNull: false,
      defaultValue: () => ulid(),
    },
    // Other fields...
  },
  {
    indexes: [
      // Add performance indexes
      {
        fields: ["frequently_queried_field"],
      },
    ],
  }
);
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

### JSDoc Standards for Controllers

Use comprehensive JSDoc comments with Swagger annotations (follow Song controller pattern):

```javascript
/**
 * @Summary Brief action description (e.g., "Get all songs with pagination")
 * @Description Detailed explanation of what the endpoint does
 * @Tags Resource name (e.g., Song, Tag, User)
 * @Produce application/json
 * @Accept application/json (for POST/PUT)
 * @Param name location type required "description" default(value) enum:["option1","option2"]
 * @Body {object} RequestSchemaName "Request body description"
 * @Success statusCode {object} ResponseSchemaName "Success message"
 * @Failure statusCode {object} ErrorSchemaName "Error message"
 * @Router /endpoint/{param} [method]
 * @auth (for protected routes)
 */
static methodName = ErrorHandler.asyncHandler(async (req, res) => {
  // Implementation
});
```

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
router.method("/endpoint", middleware, Controller.method);
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

## Schema Management

### Schema Organization

Follow the established directory structure for API schemas:

```
schemas/
├── requests/
│   ├── CreateSongRequest.js
│   ├── UpdateSongRequest.js
│   └── LoginRequest.js
└── responses/
    ├── SongResponse.js
    ├── SongsResponse.js
    └── LoginResponse.js
```

### Schema Format Standards

Follow the legacy schema code format style used throughout the codebase:

**Request Schema Format:**
```javascript
export default {
  type: "object",
  required: ["title", "artist"],
  properties: {
    title: {
      type: "string",
      example: "Amazing Grace",
      description: "Title of the song",
    },
    artist: {
      type: "string",
      example: "John Newton",
      description: "Artist or composer of the song",
    },
    tag_names: {
      type: "array",
      items: {
        type: "string",
      },
      example: ["Gospel", "Worship", "Contemporary"],
      description: "Array of tag names. If a tag doesn't exist, it will be created automatically",
    },
  },
};
```

**Response Schema Format:**
```javascript
export default {
  type: "object",
  properties: {
    code: {
      type: "integer",
      example: 200,
    },
    message: {
      type: "string",
      example: "Song retrieved successfully",
    },
    data: {
      type: "object",
      properties: {
        id: {
          type: "string",
          example: "01HPQR2ST3UV4WXY5Z6789ABCD",
          description: "Unique identifier for the song",
        },
        title: {
          type: "string",
          example: "Amazing Grace",
          description: "Title of the song",
        },
        tags: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: {
                type: "string",
                example: "01HPQR2ST3UV4WXY5Z6789ABCE",
              },
              name: {
                type: "string",
                example: "Gospel",
              },
              description: {
                type: "string",
                example: "Traditional gospel music",
              },
            },
          },
          description: "Tags associated with the song",
        },
        createdAt: {
          type: "string",
          format: "date-time",
          example: "2024-01-15T10:30:00.000Z",
        },
        updatedAt: {
          type: "string",
          format: "date-time",
          example: "2024-01-15T10:30:00.000Z",
        },
      },
    },
  },
};
```

### Schema Consistency Rules

- **Request schemas**: Include all possible input fields with validation rules
- **Response schemas**: Mirror actual API response structure exactly
- **Examples**: Provide realistic, meaningful example data
- **Descriptions**: Write clear, actionable descriptions for each field
- **Types**: Use correct OpenAPI types (string, integer, boolean, array, object)
- **Common schemas**: Reuse base response formats from `package/src/schemas/common/`

### Naming Conventions

- **Requests**: `{Action}{Resource}Request.js` (e.g., `CreateSongRequest.js`)
- **Responses**: `{Resource}Response.js` for single items, `{Resource}sResponse.js` for collections
- **Fields**: Use snake_case to match database columns
- **Examples**: Use realistic data that represents actual use cases

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

## Build Process Integration

### Pre-Deployment Checklist

Before deploying or committing new features, follow this workflow:

1. **Complete Implementation**: Ensure all layers are implemented (Model [if new] → Service → Controller → Schema)
2. **Test Endpoints**: Verify all CRUD operations work correctly
3. **Run Build Process**: Execute `npm run build` or `npm run vercel-build`
4. **Fix Issues**: Address any linting errors or API documentation generation issues
5. **Verify Documentation**: Check generated Swagger documentation is accurate

### Build Commands

```bash
# Generate API documentation and fix linting issues
npm run build

# Vercel-specific build (includes build + additional checks)  
npm run vercel-build

# Individual commands
npm run swagpress:generate-api    # Generate API docs
npm run lint                      # Check code quality
npm run lint:fix                  # Auto-fix linting issues
```

### API Documentation Generation

The build process automatically generates OpenAPI documentation from:
- Controller JSDoc comments (@Summary, @Description, etc.)
- Schema files in `/schemas/requests/` and `/schemas/responses/`
- Route definitions in `routes/api.js`

### Common Build Issues

**Schema Reference Errors**: Ensure schema files are properly exported and named correctly
**Missing JSDoc**: All controller methods must have complete Swagger annotations
**Linting Failures**: Fix code style issues before deployment
**Import Errors**: Verify all schema imports in controllers match file names

### Quality Gates

The build process enforces:
- Code style consistency (ESLint + Prettier)
- Complete API documentation (Swagger)
- Schema validation and consistency
- Import/export correctness
