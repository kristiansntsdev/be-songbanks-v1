# Swagpress Framework Documentation

## Overview

Swagpress is a Laravel-inspired Node.js framework designed to help PHP/Laravel developers transition to Node.js with familiar patterns and conventions. It provides a clean, consistent development experience with powerful CLI tools and automatic error handling.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Core Features](#core-features)
3. [Documentation](#documentation)
4. [Examples](#examples)
5. [Framework Philosophy](#framework-philosophy)

## Quick Start

### 1. Generate a Complete Resource

```bash
# Create a blog post resource
npm run swagpress:make --model --name=Post
npm run swagpress:make --service --name=PostService
npm run swagpress:make --controller --name=PostController

# Generate API documentation
npm run swagpress:docs --generate
```

### 2. Use Laravel-Style Error Handling

```javascript
const {
  AuthenticationException,
  ValidationException,
} = require("./package/swagpress");
const ErrorHandler = require("./app/middleware/ErrorHandler");

class AuthController {
  static login = ErrorHandler.asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Just throw exceptions - middleware handles everything
    if (!email) {
      throw ValidationException.required("email");
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new AuthenticationException("Invalid credentials");
    }

    res.json({
      code: 200,
      message: "Login successful",
      data: { user, token },
    });
  });
}
```

### 3. That's It!

- No try/catch blocks needed
- Consistent error responses
- Auto-generated documentation
- Laravel-familiar patterns

## Core Features

### 🚀 Laravel-Inspired CLI Commands

Generate controllers, services, and models with Laravel Artisan-style commands:

```bash
npm run swagpress:make --controller --name=UserController
npm run swagpress:make --service --name=UserService
npm run swagpress:make --model --name=User
npm run swagpress:docs --generate
```

### 📦 Clean Framework Structure

All framework components are organized in the `package/` directory:

```
package/
├── swagpress.js          # Main framework entry point
├── index.js              # CLI commands entry point
└── src/
    ├── engine/           # Core framework engine
    │   ├── exceptions/   # Exception system
    │   ├── core/         # Base models, migrations, etc.
    │   └── ...
    └── commands/         # CLI command implementations
```

**Import Pattern**: Always import from `require('./package/swagpress')` for framework features.

**Benefits:**

- Consistent code structure
- Best practices built-in
- No boilerplate code
- Automatic documentation generation

### ⚡ Clean Error Handling

Exception-based error handling that eliminates try/catch blocks:

```javascript
// Instead of this mess:
try {
  const user = await User.findByPk(id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  // ... more logic
} catch (error) {
  return res.status(500).json({ error: error.message });
}

// Just this:
const user = await User.findByPk(id);
if (!user) {
  throw new ModelNotFoundException("User", id);
}
// Middleware handles the rest automatically!
```

### 📚 Auto-Generated Documentation

Convention over configuration approach to API documentation:

```bash
npm run swagpress:docs --generate
```

- Discovers all controllers automatically
- Generates OpenAPI 3.0 specifications
- Creates consistent route patterns
- Includes error response schemas

### 🎯 Service Layer Architecture

Clean separation of concerns with Controller → Service → Model pattern:

```javascript
// Controller (HTTP layer)
class PostController {
  static index = ErrorHandler.asyncHandler(async (req, res) => {
    const posts = await PostService.getAllPosts(req.query);
    res.json({ code: 200, data: posts });
  });
}

// Service (Business logic)
class PostService {
  static async getAllPosts(options) {
    const posts = await Post.findAll({ where: options });
    return posts;
  }
}

// Model (Data layer)
class Post extends BaseModel {
  static get fillable() {
    return ["title", "content"];
  }
}
```

## Documentation

### Core Documentation

- **[Error Handling](./ErrorHandling.md)** - Complete guide to exception handling
- **[CLI Commands](./CLI-Commands.md)** - Laravel Artisan-style commands
- **[Examples](../examples/)** - Practical usage examples

### Quick Reference

#### Available Exceptions

```javascript
const {
  // Validation
  ValidationException,

  // Authentication
  AuthenticationException,
  AccountAccessDeniedException,

  // HTTP Errors
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,

  // Application
  ModelNotFoundException,
  DuplicateResourceException,
} = require("./package/swagpress");
```

#### CLI Commands

```bash
# Generate resources
npm run swagpress:make --controller --name=ControllerName
npm run swagpress:make --service --name=ServiceName
npm run swagpress:make --model --name=ModelName

# Generate documentation
npm run swagpress:docs --generate
```

#### Controller Pattern

```javascript
const ErrorHandler = require("../middleware/ErrorHandler");
const { ValidationException } = require("../package/swagpress");

class ResourceController {
  static method = ErrorHandler.asyncHandler(async (req, res) => {
    // Validation
    if (!req.body.field) {
      throw ValidationException.required("field");
    }

    // Business logic via service
    const result = await ResourceService.doSomething(req.body);

    // Consistent response
    res.json({
      code: 200,
      message: "Success message",
      data: result,
    });
  });
}
```

## Examples

### Complete CRUD Example

```javascript
// Generate the files
// npm run swagpress:make --model --name=Post
// npm run swagpress:make --service --name=PostService
// npm run swagpress:make --controller --name=PostController

const ErrorHandler = require("../middleware/ErrorHandler");
const {
  ValidationException,
  ModelNotFoundException,
} = require("../package/swagpress");

class PostController {
  // GET /api/posts
  static index = ErrorHandler.asyncHandler(async (req, res) => {
    const posts = await PostService.getAllPosts(req.query);
    res.json({ code: 200, data: posts });
  });

  // GET /api/posts/:id
  static show = ErrorHandler.asyncHandler(async (req, res) => {
    const post = await PostService.getPostById(req.params.id);
    res.json({ code: 200, data: post });
  });

  // POST /api/posts
  static store = ErrorHandler.asyncHandler(async (req, res) => {
    const post = await PostService.createPost(req.body, req.user.id);
    res.json({ code: 201, data: post });
  });

  // PUT /api/posts/:id
  static update = ErrorHandler.asyncHandler(async (req, res) => {
    const post = await PostService.updatePost(
      req.params.id,
      req.body,
      req.user.id
    );
    res.json({ code: 200, data: post });
  });

  // DELETE /api/posts/:id
  static destroy = ErrorHandler.asyncHandler(async (req, res) => {
    await PostService.deletePost(req.params.id, req.user.id);
    res.json({ code: 200, message: "Post deleted successfully" });
  });
}

class PostService {
  static async getPostById(postId) {
    const post = await Post.findByPk(postId);
    if (!post) {
      throw new ModelNotFoundException("Post", postId);
    }
    return post;
  }

  static async createPost(postData, userId) {
    if (!postData.title) {
      throw ValidationException.required("title");
    }

    return await Post.create({ ...postData, userId });
  }

  // ... other methods
}
```

### Validation Example

```javascript
const { ValidationException } = require("./package/swagpress");

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

    // Throw if any errors
    if (validation.errors.length > 0) {
      throw validation;
    }

    return await User.create(userData);
  }
}
```

### Authentication Example

```javascript
const {
  AuthenticationException,
  AccountAccessDeniedException,
} = require("./package/swagpress");

class AuthService {
  static async login(email, password) {
    if (!email) throw ValidationException.required("email");
    if (!password) throw ValidationException.required("password");

    const user = await User.findOne({ where: { email } });
    if (!user || user.password !== password) {
      throw new AuthenticationException("Invalid credentials");
    }

    if (user.status !== "active") {
      throw new AccountAccessDeniedException(user.status);
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);

    return {
      user: user.toJSON(),
      token,
      message: "Login successful",
    };
  }
}
```

## Framework Philosophy

### 1. **Laravel Familiarity**

Swagpress brings Laravel patterns to Node.js:

- Artisan-style CLI commands
- Service layer architecture
- Exception-based error handling
- Convention over configuration

### 2. **Clean Code**

- No boilerplate code
- Consistent patterns
- Automatic error handling
- Self-documenting APIs

### 3. **Developer Experience**

- Familiar patterns for PHP developers
- Minimal configuration
- Auto-generated documentation
- Comprehensive error messages

### 4. **Production Ready**

- Proper error handling
- Security best practices
- Performance optimizations
- Monitoring and logging

## Migration from Laravel

### Familiar Patterns

| Laravel                                     | Swagpress                                   |
| ------------------------------------------- | ------------------------------------------- |
| `php artisan make:controller`               | `npm run swagpress:make --controller`       |
| `php artisan make:model`                    | `npm run swagpress:make --model`            |
| `throw ValidationException::withMessages()` | `throw ValidationException.field()`         |
| `abort(404)`                                | `throw new NotFoundException()`             |
| `$model->findOrFail()`                      | `Model.findByPk() + ModelNotFoundException` |

### Response Format

Laravel and Swagpress both use consistent response formats:

```javascript
// Both frameworks return:
{
    "code": 200,
    "message": "Success message",
    "data": { ... }
}

// Error responses:
{
    "code": 422,
    "message": "Validation failed",
    "errors": [
        {"field": "email", "message": "email is required"}
    ]
}
```

### Architecture

Both frameworks use the same architectural patterns:

- **Controller**: Handle HTTP requests/responses
- **Service**: Business logic and validation
- **Model**: Data access and relationships
- **Middleware**: Cross-cutting concerns

## Getting Started

1. **Read the Documentation**
   - Start with [Error Handling](./ErrorHandling.md)
   - Then [CLI Commands](./CLI-Commands.md)

2. **Generate Your First Resource**

   ```bash
   npm run swagpress:make --model --name=Example
   npm run swagpress:make --service --name=ExampleService
   npm run swagpress:make --controller --name=ExampleController
   ```

3. **Try the Examples**
   - Look at `examples/` directory
   - Run the generated code
   - Modify and experiment

4. **Build Your Application**
   - Use the patterns consistently
   - Leverage the CLI tools
   - Let the framework handle the boilerplate

## Support

- **Documentation**: Read the guides in `docs/`
- **Examples**: Check `examples/` directory
- **Issues**: Open GitHub issues for bugs
- **Questions**: Use discussions for questions

Swagpress makes Node.js development feel like Laravel - familiar, productive, and enjoyable! 🚀
