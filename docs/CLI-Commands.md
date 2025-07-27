# CLI Commands Documentation

## Overview

Swagpress Framework provides Laravel Artisan-inspired CLI commands for rapid development. These commands help you generate controllers, services, models, and documentation following consistent patterns and best practices.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Make Commands](#make-commands)
3. [Documentation Commands](#documentation-commands)
4. [Generated Code Examples](#generated-code-examples)
5. [Command Options](#command-options)
6. [Best Practices](#best-practices)

## Quick Start

### Available Commands

```bash
# Generate controllers, services, and models
npm run swagpress:make --controller --name=ControllerName
npm run swagpress:make --service --name=ServiceName
npm run swagpress:make --model --name=ModelName

# Generate complete API documentation
npm run swagpress:docs --generate
```

## Make Commands

### Generate Controller

```bash
npm run swagpress:make --controller --name=PostController
```

**What it creates:**

- `app/controllers/PostController.js`
- Full CRUD methods (index, show, store, update, destroy)
- Laravel-style method naming
- Error handling with `ErrorHandler.asyncHandler`
- Standardized response format
- JSDoc comments for documentation

**Smart File Handling:**

- If file exists, automatically creates `PostControllerCopy.js`
- Subsequent runs create `PostControllerCopy2.js`, `PostControllerCopy3.js`, etc.
- Class names inside files are automatically updated to match

**Generated Controller Structure:**

```javascript
const PostService = require("../services/PostService");
const ErrorHandler = require("../middleware/ErrorHandler");

class PostController {
  // GET /api/posts
  static index = ErrorHandler.asyncHandler(async (req, res) => {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search,
    };

    const result = await PostService.getAllPosts(options);

    res.json({
      code: 200,
      message: "Get all posts",
      data: result,
    });
  });

  // ... other CRUD methods
}
```

### Generate Service

```bash
npm run swagpress:make --service --name=PostService
```

**What it creates:**

- `app/services/PostService.js`
- Business logic layer with comprehensive methods
- Database operations with proper error handling
- Pagination and filtering support
- Exception handling using Swagpress exceptions

**Smart File Handling:**

- If file exists, automatically creates `PostServiceCopy.js`
- Class names are automatically updated to match the filename

**Generated Service Structure:**

```javascript
const { Op } = require("sequelize");
const Post = require("../models/Post");
const {
  ModelNotFoundException,
  ValidationException,
} = require("../../swagpress");

class PostService {
  static async getAllPosts(options = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = options;

    const offset = (page - 1) * limit;
    const where = {};

    // Add search filter
    if (search) {
      where[Op.or] = [
        // Add searchable fields here
      ];
    }

    const { count, rows } = await Post.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [[sortBy, sortOrder]],
    });

    return {
      posts: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit),
        hasNextPage: page * limit < count,
        hasPrevPage: page > 1,
      },
    };
  }

  // ... other service methods
}
```

### Generate Model

```bash
npm run swagpress:make --model --name=Post
```

**What it creates:**

- `app/models/Post.js`
- Enhanced BaseModel with Laravel-like features
- Fillable attributes
- Hidden attributes for JSON output
- Type casting
- Relationship definitions
- Model factory registration

**Smart File Handling:**

- If file exists, automatically creates `PostCopy.js`
- Class names and table names are automatically updated

**Generated Model Structure:**

```javascript
const { BaseModel, ModelFactory } = require("../../package/src/engine");
const sequelize = require("../../config/database");

class Post extends BaseModel {
  static get fillable() {
    return [
      // Add fillable fields here
      // 'title',
      // 'content',
      // 'status'
    ];
  }

  static get hidden() {
    return [
      // Add fields to hide from JSON output
      // 'password',
      // 'secret_key'
    ];
  }

  static get casts() {
    return {
      // Add type casting here
      // 'is_active': 'boolean',
      // 'created_at': 'date'
    };
  }

  static associate(models) {
    // Define relationships here
    // this.belongsTo(models.User, {
    //     foreignKey: 'user_id',
    //     as: 'user'
    // });
  }
}

module.exports = ModelFactory.register(Post, sequelize, {
  tableName: "posts",
});
```

## Documentation Commands

### Generate API Documentation

```bash
npm run swagpress:docs --generate
```

**What it does:**

- Auto-discovers all controllers in `app/controllers/`
- Generates complete OpenAPI 3.0 specification
- Creates standardized route patterns
- Includes request/response schemas
- Updates `swagger/swagger.json`
- Convention over configuration approach

**Features:**

- **Auto-Discovery**: Finds all controller methods automatically
- **REST Conventions**: Follows Laravel/Rails REST patterns
- **Error Schemas**: Includes all standard error responses
- **Security**: Automatically adds JWT auth where needed
- **Validation**: Includes request validation schemas

**Generated Documentation Includes:**

- Complete API paths for all controllers
- Request/response schemas
- Authentication requirements
- Error response formats
- Parameter validation
- Status codes and descriptions

## Generated Code Examples

### Complete Resource Generation

```bash
# Generate a complete blog post resource
npm run swagpress:make --model --name=Post
npm run swagpress:make --service --name=PostService
npm run swagpress:make --controller --name=PostController

# Generate documentation
npm run swagpress:docs --generate
```

This creates a complete CRUD resource with:

1. **Model** (`app/models/Post.js`)
   - Database model with relationships
   - Fillable and hidden attributes
   - Type casting

2. **Service** (`app/services/PostService.js`)
   - Business logic layer
   - Database operations
   - Validation and error handling
   - Pagination support

3. **Controller** (`app/controllers/PostController.js`)
   - HTTP request handling
   - Route methods (index, show, store, update, destroy)
   - Response formatting
   - Error handling

4. **Documentation** (`swagger/swagger.json`)
   - OpenAPI specification
   - All endpoints documented
   - Request/response schemas

### Example Generated Routes

The generated controller creates these standard REST routes:

```
GET    /api/posts           # PostController.index
GET    /api/posts/:id       # PostController.show
POST   /api/posts           # PostController.store
PUT    /api/posts/:id       # PostController.update
DELETE /api/posts/:id       # PostController.destroy
```

## Command Options

### Make Command Options

```bash
# Controller generation
npm run swagpress:make --controller --name=ControllerName

# Service generation
npm run swagpress:make --service --name=ServiceName

# Model generation
npm run swagpress:make --model --name=ModelName
```

**Naming Conventions:**

- Controllers: Always end with "Controller" (auto-added if missing)
- Services: Always end with "Service" (auto-added if missing)
- Models: Singular, PascalCase (e.g., "Post", "User", "BlogPost")

### Documentation Command Options

```bash
# Generate complete documentation
npm run swagpress:docs --generate
```

**Features:**

- Scans all controllers automatically
- Updates existing swagger.json
- Preserves custom schemas
- Adds new endpoints automatically

## Best Practices

### 1. Naming Conventions

```bash
# ✅ Good: Clear, descriptive names
npm run swagpress:make --controller --name=BlogPostController
npm run swagpress:make --service --name=UserManagementService
npm run swagpress:make --model --name=BlogPost

# ❌ Bad: Unclear or inconsistent names
npm run swagpress:make --controller --name=Controller1
npm run swagpress:make --service --name=Service
```

### 2. Generation Order

```bash
# ✅ Good: Generate in logical order
npm run swagpress:make --model --name=Post
npm run swagpress:make --service --name=PostService
npm run swagpress:make --controller --name=PostController
npm run swagpress:docs --generate
```

**Why this order:**

1. **Model first**: Defines the data structure
2. **Service next**: Implements business logic using the model
3. **Controller last**: Handles HTTP requests using the service
4. **Documentation**: Updates API docs with new endpoints

### 3. Resource Organization

```bash
# ✅ Good: One resource per command
npm run swagpress:make --model --name=User
npm run swagpress:make --model --name=Post
npm run swagpress:make --model --name=Comment

# Each resource gets its own service and controller
npm run swagpress:make --service --name=UserService
npm run swagpress:make --controller --name=UserController
```

### 4. Customization After Generation

After generating code, customize it for your needs:

1. **Model**: Add fields to `fillable`, define relationships
2. **Service**: Implement specific business logic, add validation
3. **Controller**: Add custom endpoints, modify responses
4. **Documentation**: Regenerate after making changes

### 5. Regular Documentation Updates

```bash
# Run this after making changes to controllers
npm run swagpress:docs --generate
```

**When to regenerate docs:**

- After adding new controllers
- After modifying controller methods
- After changing route patterns
- Before deploying to production

## Integration with Development Workflow

### 1. Feature Development Workflow

```bash
# 1. Create new feature branch
git checkout -b feature/blog-posts

# 2. Generate resource files
npm run swagpress:make --model --name=BlogPost
npm run swagpress:make --service --name=BlogPostService
npm run swagpress:make --controller --name=BlogPostController

# 3. Implement business logic
# Edit generated files to add specific functionality

# 4. Add routes (manual step)
# Add routes to routes/api.js

# 5. Update documentation
npm run swagpress:docs --generate

# 6. Test and commit
npm test
git add .
git commit -m "Add blog post resource"
```

### 2. API-First Development

```bash
# 1. Design API endpoints first
# 2. Generate controllers for endpoints
npm run swagpress:make --controller --name=ApiController

# 3. Generate services for business logic
npm run swagpress:make --service --name=ApiService

# 4. Generate models for data
npm run swagpress:make --model --name=ApiModel

# 5. Generate documentation
npm run swagpress:docs --generate

# 6. Share API docs with frontend team
```

### 3. Team Development

```bash
# Each team member can generate consistent code structure
npm run swagpress:make --controller --name=FeatureController
npm run swagpress:make --service --name=FeatureService

# Documentation stays in sync
npm run swagpress:docs --generate
```

## Troubleshooting

### Common Issues

1. **"Controller already exists"**

   ```bash
   # The command automatically creates a copy with suffix when file exists
   npm run swagpress:make --controller --name=ExistingController
   # Creates: ExistingControllerCopy.js

   # Running again creates incremental copies
   npm run swagpress:make --controller --name=ExistingController
   # Creates: ExistingControllerCopy2.js

   # To overwrite existing file, delete it first
   rm app/controllers/ExistingController.js
   npm run swagpress:make --controller --name=ExistingController
   ```

2. **"Directory not found"**

   ```bash
   # Make sure you're in the project root directory
   cd /path/to/your/swagpress/project
   npm run swagpress:make --controller --name=TestController
   ```

3. **"Command not found"**
   ```bash
   # Make sure the command is added to package.json
   npm run swagpress:make
   ```

### Getting Help

```bash
# Show usage information
npm run swagpress:make

# Show documentation command help
npm run swagpress:docs
```

## Advanced Usage

### Custom Templates

The generated templates are optimized for Laravel developers transitioning to Node.js. They include:

- **Laravel-style method names** (index, show, store, update, destroy)
- **Consistent response format** ({code, message, data})
- **Service layer pattern** (Controller → Service → Model)
- **Proper error handling** (Exceptions instead of try/catch)
- **Documentation comments** (JSDoc format)

### Integration with Existing Code

Generated code integrates seamlessly with:

- Existing Sequelize models
- Custom middleware
- Authentication systems
- Validation libraries
- Custom error handlers

The CLI commands provide a starting point that you can customize for your specific needs while maintaining consistency across your application.
