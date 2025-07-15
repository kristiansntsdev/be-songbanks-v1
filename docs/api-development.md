# API Development Guide

## Creating a New API Endpoint

### Step 1: Create a Model

```bash
# Create a new model
make model:create name=Post

# This creates: app/models/Post.js
```

Example model (`app/models/Post.js`):
```javascript
const { DataTypes } = require('sequelize');
const { ulid } = require('ulid');
const sequelize = require('../../config/database');

const Post = sequelize.define('posts', {
    id: {
        type: DataTypes.STRING(26),
        primaryKey: true,
        allowNull: false,
        defaultValue: () => ulid()
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    userId: {
        type: DataTypes.STRING(26),
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    }
});

module.exports = Post;
```

### Step 2: Create a Migration

```bash
# Create migration for posts table
make migration:create name=create_posts
```

Example migration (`database/migrations/YYYYMMDD-create-posts.js`):
```javascript
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('posts', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING(26)
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      userId: {
        type: Sequelize.STRING(26),
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('posts');
  }
};
```

### Step 3: Create a Controller

```bash
# Create a new controller
make controller:create name=PostController
```

Example controller (`app/controllers/PostController.js`):
```javascript
const Post = require('../models/Post');
const ErrorController = require('./ErrorController');

class PostController {
    // GET /api/posts
    static async index(req, res) {
        try {
            const posts = await Post.findAll({
                where: { userId: req.user.userId },
                order: [['createdAt', 'DESC']]
            });
            res.json(posts);
        } catch (error) {
            ErrorController.handleError(error, req, res);
        }
    }

    // POST /api/posts
    static async create(req, res) {
        try {
            const { title, content } = req.body;
            
            if (!title || !content) {
                return ErrorController.badRequest(res, 'Title and content are required');
            }

            const post = await Post.create({
                title,
                content,
                userId: req.user.userId
            });

            res.status(201).json(post);
        } catch (error) {
            ErrorController.handleError(error, req, res);
        }
    }

    // GET /api/posts/:id
    static async show(req, res) {
        try {
            const post = await Post.findOne({
                where: { 
                    id: req.params.id,
                    userId: req.user.userId 
                }
            });

            if (!post) {
                return ErrorController.notFound(req, res);
            }

            res.json(post);
        } catch (error) {
            ErrorController.handleError(error, req, res);
        }
    }

    // PUT /api/posts/:id
    static async update(req, res) {
        try {
            const { title, content } = req.body;
            
            const post = await Post.findOne({
                where: { 
                    id: req.params.id,
                    userId: req.user.userId 
                }
            });

            if (!post) {
                return ErrorController.notFound(req, res);
            }

            await post.update({ title, content });
            res.json(post);
        } catch (error) {
            ErrorController.handleError(error, req, res);
        }
    }

    // DELETE /api/posts/:id
    static async destroy(req, res) {
        try {
            const post = await Post.findOne({
                where: { 
                    id: req.params.id,
                    userId: req.user.userId 
                }
            });

            if (!post) {
                return ErrorController.notFound(req, res);
            }

            await post.destroy();
            res.json({ message: 'Post deleted successfully' });
        } catch (error) {
            ErrorController.handleError(error, req, res);
        }
    }
}

module.exports = PostController;
```

### Step 4: Add Routes

Add routes to `routes/api.js`:
```javascript
const PostController = require('../app/controllers/PostController');

// Posts routes (protected)
router.get('/posts', authenticateToken, PostController.index);
router.post('/posts', authenticateToken, PostController.create);
router.get('/posts/:id', authenticateToken, PostController.show);
router.put('/posts/:id', authenticateToken, PostController.update);
router.delete('/posts/:id', authenticateToken, PostController.destroy);
```

### Step 5: Add Swagger Documentation

Add Swagger docs to `routes/api.js`:
```javascript
/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Get all posts
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
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
 *     responses:
 *       201:
 *         description: Post created successfully
 */
```

### Step 6: Run Migration and Test

```bash
# Run migration
make migrate

# Start server
npm start

# Test in Swagger UI
open http://localhost:3000/api-docs
```

## RESTful API Conventions

### HTTP Methods
- `GET` - Retrieve resources
- `POST` - Create new resources
- `PUT` - Update entire resources
- `PATCH` - Update partial resources
- `DELETE` - Delete resources

### URL Structure
```
GET    /api/posts      # List all posts
POST   /api/posts      # Create new post
GET    /api/posts/:id  # Get specific post
PUT    /api/posts/:id  # Update specific post
DELETE /api/posts/:id  # Delete specific post
```

### Response Status Codes
- `200` - OK (successful GET, PUT, DELETE)
- `201` - Created (successful POST)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

### Error Response Format
```json
{
  "error": "Bad Request",
  "message": "Title and content are required",
  "statusCode": 400
}
```

## Best Practices

1. **Always validate input** in controllers
2. **Use try-catch blocks** for error handling
3. **Check user permissions** for resource access
4. **Use ULID for primary keys** instead of auto-increment
5. **Follow RESTful conventions** for URLs and methods
6. **Document APIs** with Swagger
7. **Test endpoints** before deploying