# Error Handling Documentation

## Overview

Swagpress Framework provides a Laravel-inspired exception handling system that simplifies error management in your Node.js applications. The system uses custom exception classes and automatic error handling middleware to provide consistent, clean error responses.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Available Exceptions](#available-exceptions)
3. [Basic Usage](#basic-usage)
4. [Controller Integration](#controller-integration)
5. [Service Layer](#service-layer)
6. [Validation](#validation)
7. [Custom Exceptions](#custom-exceptions)
8. [Error Response Format](#error-response-format)
9. [Migration Guide](#migration-guide)
10. [Best Practices](#best-practices)

## Quick Start

### 1. Import Exceptions

```javascript
const {
  AuthenticationException,
  ValidationException,
  ModelNotFoundException,
  BadRequestException,
  ForbiddenException,
} = require("../package/swagpress");

const ErrorHandler = require("../app/middleware/ErrorHandler");
```

> **Note**: The framework entry point is located at `package/swagpress.js` for clean organization. All exceptions and utilities are accessible through this single import.

### 2. Wrap Controller Methods

```javascript
class UserController {
  static getUser = ErrorHandler.asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Just throw exceptions - middleware handles everything
    if (!userId) {
      throw ValidationException.required("userId");
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw new ModelNotFoundException("User", userId);
    }

    res.json({
      code: 200,
      message: "User retrieved successfully",
      data: user,
    });
  });
}
```

### 3. That's it!

No try/catch blocks needed. All exceptions are automatically caught and formatted into consistent responses.

## Available Exceptions

### Base Exceptions

- `BaseException` - Base class for all exceptions
- `ValidationException` - For validation errors (422)

### HTTP Exceptions

- `BadRequestException` - 400 Bad Request
- `UnauthorizedException` - 401 Unauthorized
- `ForbiddenException` - 403 Forbidden
- `NotFoundException` - 404 Not Found
- `ConflictException` - 409 Conflict
- `TooManyRequestsException` - 429 Too Many Requests
- `InternalServerException` - 500 Internal Server Error

### Application Exceptions

- `AuthenticationException` - Authentication failures
- `AccountAccessDeniedException` - Account status issues
- `ModelNotFoundException` - Database record not found
- `DuplicateResourceException` - Resource already exists

## Basic Usage

### Validation Errors

```javascript
// Single field validation
if (!email) {
  throw ValidationException.required("email");
}

// Custom validation message
if (!email.includes("@")) {
  throw ValidationException.invalid("email", "must be a valid email address");
}

// Multiple validation errors
const validation = new ValidationException("Multiple validation errors");
if (!email) validation.addError("email", "Email is required");
if (!password) validation.addError("password", "Password is required");

if (validation.errors.length > 0) {
  throw validation;
}
```

### Authentication Errors

```javascript
// Invalid credentials
if (!user || user.password !== password) {
  throw new AuthenticationException("Invalid credentials");
}

// Token errors
if (tokenExpired) {
  throw new AuthenticationException("Token expired");
}

// Account status
if (user.status !== "active") {
  throw new AccountAccessDeniedException(user.status);
}
```

### Not Found Errors

```javascript
// Model not found with ID
const user = await User.findByPk(userId);
if (!user) {
  throw new ModelNotFoundException("User", userId);
}

// Generic not found
throw new NotFoundException("Resource not found");
```

### Permission Errors

```javascript
// Forbidden access
if (user.role !== "admin") {
  throw new ForbiddenException("Admin access required");
}

// Resource ownership
if (post.userId !== currentUser.id) {
  throw new ForbiddenException("You can only edit your own posts");
}
```

### Business Logic Errors

```javascript
// Age validation
if (user.age < 18) {
  throw new BadRequestException("Users must be at least 18 years old");
}

// Insufficient credits
if (user.credits < requiredCredits) {
  throw new BadRequestException(
    `Insufficient credits. Required: ${requiredCredits}, Available: ${user.credits}`
  );
}

// Duplicate resource
const existingUser = await User.findOne({ where: { email } });
if (existingUser) {
  throw new DuplicateResourceException("User", "email");
}
```

## Controller Integration

### Using ErrorHandler.asyncHandler

```javascript
const ErrorHandler = require("../app/middleware/ErrorHandler");
const {
  ValidationException,
  ModelNotFoundException,
} = require("../package/swagpress");

class PostController {
  // ✅ Good: Clean controller with automatic error handling
  static index = ErrorHandler.asyncHandler(async (req, res) => {
    const posts = await PostService.getAllPosts(req.query);

    res.json({
      code: 200,
      message: "Posts retrieved successfully",
      data: posts,
    });
  });

  static show = ErrorHandler.asyncHandler(async (req, res) => {
    const post = await PostService.getPostById(req.params.id);

    res.json({
      code: 200,
      message: "Post retrieved successfully",
      data: post,
    });
  });

  static store = ErrorHandler.asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const post = await PostService.createPost(req.body, userId);

    res.json({
      code: 201,
      message: "Post created successfully",
      data: post,
    });
  });
}
```

### ❌ Don't Do This (Old Way)

```javascript
class PostController {
  // ❌ Bad: Manual error handling with try/catch
  static async index(req, res) {
    try {
      const posts = await PostService.getAllPosts(req.query);
      res.json({ code: 200, data: posts });
    } catch (error) {
      ErrorController.handleError(error, req, res);
    }
  }
}
```

## Service Layer

### Clean Service Methods

```javascript
const {
  ModelNotFoundException,
  ValidationException,
  ForbiddenException,
} = require("../package/swagpress");

class PostService {
  static async getPostById(postId) {
    const post = await Post.findByPk(postId);

    if (!post) {
      throw new ModelNotFoundException("Post", postId);
    }

    return post;
  }

  static async createPost(postData, userId) {
    // Validation
    if (!postData.title) {
      throw ValidationException.required("title");
    }

    if (!postData.content) {
      throw ValidationException.required("content");
    }

    // Business logic
    if (postData.title.length < 5) {
      throw ValidationException.invalid(
        "title",
        "must be at least 5 characters long"
      );
    }

    // Create post
    const post = await Post.create({
      ...postData,
      userId,
    });

    return post;
  }

  static async updatePost(postId, updateData, userId) {
    const post = await this.getPostById(postId);

    // Authorization
    if (post.userId !== userId) {
      throw new ForbiddenException("You can only edit your own posts");
    }

    await post.update(updateData);
    return post;
  }

  static async deletePost(postId, userId) {
    const post = await this.getPostById(postId);

    // Authorization
    if (post.userId !== userId) {
      throw new ForbiddenException("You can only delete your own posts");
    }

    await post.destroy();

    return {
      message: "Post deleted successfully",
    };
  }
}
```

## Validation

### Helper Methods

```javascript
const ErrorHandler = require("../app/middleware/ErrorHandler");

class UserController {
  static createUser = ErrorHandler.asyncHandler(async (req, res) => {
    // Use helper for multiple required fields
    ErrorHandler.validateRequired(["email", "password", "name"], req.body);

    // Custom validation
    if (req.body.age < 18) {
      ErrorHandler.throwValidation("age", "must be at least 18");
    }

    const user = await UserService.createUser(req.body);

    res.json({
      code: 201,
      message: "User created successfully",
      data: user,
    });
  });
}
```

### Complex Validation

```javascript
const { ValidationException } = require("../package/swagpress");

class UserService {
  static async createUser(userData) {
    const validation = new ValidationException("User validation failed");

    // Email validation
    if (!userData.email) {
      validation.addError("email", "Email is required");
    } else if (!/\S+@\S+\.\S+/.test(userData.email)) {
      validation.addError("email", "Email must be valid");
    }

    // Password validation
    if (!userData.password) {
      validation.addError("password", "Password is required");
    } else if (userData.password.length < 8) {
      validation.addError("password", "Password must be at least 8 characters");
    }

    // Age validation
    if (userData.age && userData.age < 18) {
      validation.addError("age", "Age must be at least 18");
    }

    // Check for existing user
    const existingUser = await User.findOne({
      where: { email: userData.email },
    });
    if (existingUser) {
      validation.addError("email", "Email already exists");
    }

    // Throw if any errors
    if (validation.errors.length > 0) {
      throw validation;
    }

    return await User.create(userData);
  }
}
```

## Custom Exceptions

### Creating Custom Exceptions

```javascript
const { BaseException, ForbiddenException } = require("../package/swagpress");

// Custom business logic exception
class InsufficientCreditsException extends BaseException {
  constructor(required, available) {
    super(
      `Insufficient credits. Required: ${required}, Available: ${available}`,
      402,
      "Payment Required"
    );
    this.required = required;
    this.available = available;
  }

  toSwagpressResponse() {
    return {
      code: this.statusCode,
      message: this.message,
      details: {
        required: this.required,
        available: this.available,
      },
    };
  }
}

// Usage
if (user.credits < requiredCredits) {
  throw new InsufficientCreditsException(requiredCredits, user.credits);
}
```

### Extending Existing Exceptions

```javascript
class AdminRequiredException extends ForbiddenException {
  constructor(requiredRole = "admin") {
    super(`This action requires ${requiredRole} privileges`);
    this.requiredRole = requiredRole;
  }
}

// Usage
if (user.role !== "admin") {
  throw new AdminRequiredException();
}
```

## Error Response Format

### Standard Response Format

All exceptions return a consistent JSON format:

```javascript
{
    "code": 422,
    "message": "Validation failed",
    "errors": [
        {
            "field": "email",
            "message": "email is required"
        },
        {
            "field": "password",
            "message": "password is required"
        }
    ]
}
```

### Different Exception Types

#### Authentication Exception (401)

```javascript
{
    "code": 401,
    "message": "Invalid credentials"
}
```

#### Not Found Exception (404)

```javascript
{
    "code": 404,
    "message": "User with ID 123 not found"
}
```

#### Forbidden Exception (403)

```javascript
{
    "code": 403,
    "message": "Admin access required"
}
```

#### Account Access Denied (403)

```javascript
{
    "code": 403,
    "message": "Account access denied",
    "error": "Your account status is suspended. Please contact administrator."
}
```

## Migration Guide

### From ErrorController to Exceptions

#### Old Way (Don't Use)

```javascript
const ErrorController = require("./ErrorController");

class UserController {
  static async getUser(req, res) {
    try {
      const user = await User.findByPk(req.params.id);

      if (!user) {
        return ErrorController.notFound(req, res);
      }

      res.json({ data: user });
    } catch (error) {
      ErrorController.handleError(error, req, res);
    }
  }
}
```

#### New Way (Recommended)

```javascript
const ErrorHandler = require("../middleware/ErrorHandler");
const { ModelNotFoundException } = require("../package/swagpress");

class UserController {
  static getUser = ErrorHandler.asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      throw new ModelNotFoundException("User", req.params.id);
    }

    res.json({
      code: 200,
      message: "User retrieved successfully",
      data: user,
    });
  });
}
```

### Migration Steps

1. **Replace ErrorController imports**:

   ```javascript
   // Old
   const ErrorController = require("./ErrorController");

   // New
   const ErrorHandler = require("../middleware/ErrorHandler");
   const {
     ValidationException,
     ModelNotFoundException,
   } = require("../package/swagpress");
   ```

2. **Wrap controller methods**:

   ```javascript
   // Old
   static async methodName(req, res) { ... }

   // New
   static methodName = ErrorHandler.asyncHandler(async (req, res) => { ... });
   ```

3. **Replace ErrorController calls**:

   ```javascript
   // Old
   ErrorController.badRequest(res, "Message");
   ErrorController.unauthorized(res, "Message");
   ErrorController.notFound(req, res);

   // New
   throw new BadRequestException("Message");
   throw new UnauthorizedException("Message");
   throw new NotFoundException("Message");
   ```

4. **Remove try/catch blocks**:

   ```javascript
   // Old
   try {
     // logic
   } catch (error) {
     ErrorController.handleError(error, req, res);
   }

   // New
   // Just the logic - middleware handles errors automatically
   ```

## Best Practices

### 1. Use Specific Exceptions

```javascript
// ✅ Good: Specific and clear
throw new ModelNotFoundException("User", userId);
throw ValidationException.required("email");

// ❌ Bad: Generic and unclear
throw new Error("Not found");
throw new Error("Invalid");
```

### 2. Include Helpful Messages

```javascript
// ✅ Good: Helpful error messages
throw new BadRequestException("Age must be between 18 and 120");
throw new ForbiddenException("You can only edit posts you created");

// ❌ Bad: Vague messages
throw new BadRequestException("Invalid age");
throw new ForbiddenException("Access denied");
```

### 3. Validate Early

```javascript
// ✅ Good: Validate at the start of methods
static async createUser(userData, currentUserId) {
    // Validate inputs first
    if (!userData.email) {
        throw ValidationException.required('email');
    }

    // Then business logic
    const user = await User.create(userData);
    return user;
}
```

### 4. Use Helper Methods for Common Patterns

```javascript
// ✅ Good: Use helpers for common validations
ErrorHandler.validateRequired(["email", "password"], req.body);

// ✅ Good: Use helpers for common throws
ErrorHandler.throwNotFound("User", userId);
```

### 5. Handle Permissions Consistently

```javascript
// ✅ Good: Consistent permission checking
static async updatePost(postId, updateData, userId) {
    const post = await this.getPostById(postId);

    if (post.userId !== userId) {
        throw new ForbiddenException('You can only edit your own posts');
    }

    // Continue with update...
}
```

### 6. Use Meaningful Exception Types

```javascript
// ✅ Good: Use appropriate exception types
if (user.credits < cost) {
  throw new BadRequestException(
    `Insufficient credits. Need ${cost}, have ${user.credits}`
  );
}

if (user.role !== "admin") {
  throw new ForbiddenException("Admin access required");
}

if (!user) {
  throw new ModelNotFoundException("User", userId);
}
```

### 7. Don't Catch and Re-throw

```javascript
// ✅ Good: Let exceptions bubble up
static async createPost(postData, userId) {
    const user = await this.getUserById(userId); // This might throw ModelNotFoundException
    return await Post.create({ ...postData, userId });
}

// ❌ Bad: Unnecessary catching and re-throwing
static async createPost(postData, userId) {
    try {
        const user = await this.getUserById(userId);
        return await Post.create({ ...postData, userId });
    } catch (error) {
        throw error; // Unnecessary
    }
}
```

### 8. Use Services for Business Logic

```javascript
// ✅ Good: Keep controllers thin, put logic in services
class PostController {
  static createPost = ErrorHandler.asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const post = await PostService.createPost(req.body, userId);

    res.json({
      code: 201,
      message: "Post created successfully",
      data: post,
    });
  });
}

class PostService {
  static async createPost(postData, userId) {
    // All validation and business logic here
    if (!postData.title) {
      throw ValidationException.required("title");
    }

    // ... more logic
    return await Post.create({ ...postData, userId });
  }
}
```

## Example: Complete CRUD with Error Handling

```javascript
const ErrorHandler = require("../middleware/ErrorHandler");
const {
  ValidationException,
  ModelNotFoundException,
  ForbiddenException,
} = require("../package/swagpress");

class PostController {
  // GET /api/posts
  static index = ErrorHandler.asyncHandler(async (req, res) => {
    const posts = await PostService.getAllPosts(req.query);

    res.json({
      code: 200,
      message: "Posts retrieved successfully",
      data: posts,
    });
  });

  // GET /api/posts/:id
  static show = ErrorHandler.asyncHandler(async (req, res) => {
    const post = await PostService.getPostById(req.params.id);

    res.json({
      code: 200,
      message: "Post retrieved successfully",
      data: post,
    });
  });

  // POST /api/posts
  static store = ErrorHandler.asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const post = await PostService.createPost(req.body, userId);

    res.json({
      code: 201,
      message: "Post created successfully",
      data: post,
    });
  });

  // PUT /api/posts/:id
  static update = ErrorHandler.asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const post = await PostService.updatePost(req.params.id, req.body, userId);

    res.json({
      code: 200,
      message: "Post updated successfully",
      data: post,
    });
  });

  // DELETE /api/posts/:id
  static destroy = ErrorHandler.asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const result = await PostService.deletePost(req.params.id, userId);

    res.json({
      code: 200,
      message: result.message,
    });
  });
}

class PostService {
  static async getAllPosts(options = {}) {
    const { page = 1, limit = 10, search } = options;

    // Implementation here...
    // No need for try/catch - let Sequelize errors bubble up
  }

  static async getPostById(postId) {
    const post = await Post.findByPk(postId);

    if (!post) {
      throw new ModelNotFoundException("Post", postId);
    }

    return post;
  }

  static async createPost(postData, userId) {
    // Validation
    if (!postData.title) {
      throw ValidationException.required("title");
    }

    if (!postData.content) {
      throw ValidationException.required("content");
    }

    if (postData.title.length < 5) {
      throw ValidationException.invalid(
        "title",
        "must be at least 5 characters long"
      );
    }

    // Create post
    return await Post.create({
      ...postData,
      userId,
    });
  }

  static async updatePost(postId, updateData, userId) {
    const post = await this.getPostById(postId);

    // Authorization
    if (post.userId !== userId) {
      throw new ForbiddenException("You can only edit your own posts");
    }

    // Validation
    if (updateData.title && updateData.title.length < 5) {
      throw ValidationException.invalid(
        "title",
        "must be at least 5 characters long"
      );
    }

    await post.update(updateData);
    return post;
  }

  static async deletePost(postId, userId) {
    const post = await this.getPostById(postId);

    // Authorization
    if (post.userId !== userId) {
      throw new ForbiddenException("You can only delete your own posts");
    }

    await post.destroy();

    return {
      message: "Post deleted successfully",
    };
  }
}

module.exports = PostController;
```

This documentation covers everything you need to know about using the Swagpress exception handling system. The key benefits are:

- **Clean Code**: No more try/catch blocks
- **Consistent Responses**: All errors use the same format
- **Laravel-Like**: Familiar patterns for PHP developers
- **Type Safety**: Specific exceptions for different scenarios
- **Automatic Handling**: Middleware catches and formats everything

Start with the Quick Start section and refer to the specific sections as needed!
