# Database Management Guide

## Overview

This project uses Sequelize ORM with MySQL for database operations. Database schema is managed through migrations, and initial data is populated using seeders.

## Database Configuration

### Connection Setup (`config/database.js`)

```javascript
const Sequelize = require('sequelize');
const env = require('dotenv');
env.config();

const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    dialect: 'mysql',
    host: process.env.DB_HOST
  }
);

module.exports = sequelize;
```

### Sequelize CLI Configuration (`config/config.js`)

```javascript
const env = require('dotenv');
env.config();

module.exports = {
  development: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql'
  },
  // ... other environments
};
```

## Migrations

### Creating Migrations

```bash
# Create a new migration
make migration:create name=create_posts

# This creates: database/migrations/YYYYMMDDHHMMSS-create_posts.js
```

### Migration Structure

```javascript
'use strict';

/** @type {import('sequelize-cli').Migration} */
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

    // Add indexes
    await queryInterface.addIndex('posts', ['userId']);
    await queryInterface.addIndex('posts', ['createdAt']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('posts');
  }
};
```

### Migration Commands

```bash
# Run all pending migrations
make migrate

# Run specific migration
npx sequelize-cli db:migrate --to YYYYMMDDHHMMSS-create_posts.js

# Undo last migration
make migrate:undo

# Undo all migrations
npx sequelize-cli db:migrate:undo:all

# Check migration status
npx sequelize-cli db:migrate:status
```

### Common Migration Operations

#### Adding Columns

```javascript
// Up
await queryInterface.addColumn('posts', 'status', {
  type: Sequelize.STRING,
  defaultValue: 'draft'
});

// Down
await queryInterface.removeColumn('posts', 'status');
```

#### Modifying Columns

```javascript
// Up
await queryInterface.changeColumn('posts', 'title', {
  type: Sequelize.STRING(500),
  allowNull: false
});

// Down
await queryInterface.changeColumn('posts', 'title', {
  type: Sequelize.STRING(255),
  allowNull: false
});
```

#### Adding Indexes

```javascript
// Up
await queryInterface.addIndex('posts', ['title', 'status'], {
  name: 'posts_title_status_index'
});

// Down
await queryInterface.removeIndex('posts', 'posts_title_status_index');
```

#### Adding Foreign Keys

```javascript
// Up
await queryInterface.addConstraint('posts', {
  fields: ['userId'],
  type: 'foreign key',
  name: 'posts_user_id_fk',
  references: {
    table: 'users',
    field: 'id'
  },
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

// Down
await queryInterface.removeConstraint('posts', 'posts_user_id_fk');
```

## Seeders

### Creating Seeders

```bash
# Create a new seeder
make seeder:create name=demo_posts

# This creates: database/seeders/YYYYMMDDHHMMSS-demo_posts.js
```

### Seeder Structure

```javascript
'use strict';

const { ulid } = require('ulid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Get admin user ID
    const users = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email = 'admin-test@gmail.com'",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (users.length === 0) {
      throw new Error('Admin user not found. Run user seeder first.');
    }

    const adminUserId = users[0].id;

    await queryInterface.bulkInsert('posts', [
      {
        id: ulid(),
        title: 'Welcome to Songbanks API',
        content: 'This is your first post in the Songbanks API system.',
        userId: adminUserId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: ulid(),
        title: 'Getting Started Guide',
        content: 'Learn how to use the API endpoints effectively.',
        userId: adminUserId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('posts', {
      title: ['Welcome to Songbanks API', 'Getting Started Guide']
    }, {});
  }
};
```

### Seeder Commands

```bash
# Run all seeders
make seed

# Run specific seeder
npx sequelize-cli db:seed --seed YYYYMMDDHHMMSS-demo_posts.js

# Undo all seeders
make seed:undo

# Undo specific seeder
npx sequelize-cli db:seed:undo --seed YYYYMMDDHHMMSS-demo_posts.js
```

## Models

### Creating Models

```bash
# Create a new model
make model:create name=Post

# This creates: app/models/Post.js
```

### Model Structure

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
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  userId: {
    type: DataTypes.STRING(26),
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['createdAt']
    }
  ]
});

module.exports = Post;
```

### Model Associations

```javascript
// In app/models/User.js
User.hasMany(Post, { foreignKey: 'userId' });

// In app/models/Post.js
Post.belongsTo(User, { foreignKey: 'userId' });
```

### Model Validations

```javascript
const Post = sequelize.define('posts', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Title cannot be empty'
      },
      len: {
        args: [1, 255],
        msg: 'Title must be between 1 and 255 characters'
      }
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Content cannot be empty'
      },
      len: {
        args: [1, 10000],
        msg: 'Content must be between 1 and 10000 characters'
      }
    }
  }
});
```

## Database Best Practices

### 1. ULID Primary Keys

- Use ULID instead of auto-increment integers
- Better for distributed systems
- Sortable by creation time
- URL-safe

### 2. Proper Indexing

```javascript
// Add indexes for commonly queried fields
await queryInterface.addIndex('posts', ['userId']);
await queryInterface.addIndex('posts', ['createdAt']);
await queryInterface.addIndex('posts', ['title', 'status']);
```

### 3. Foreign Key Constraints

```javascript
// Always define foreign key relationships
userId: {
  type: DataTypes.STRING(26),
  allowNull: false,
  references: {
    model: 'users',
    key: 'id'
  }
}
```

### 4. Data Validation

```javascript
// Add validation at model level
email: {
  type: DataTypes.STRING,
  allowNull: false,
  unique: true,
  validate: {
    isEmail: true
  }
}
```

### 5. Soft Deletes

```javascript
// Enable soft deletes (paranoid mode)
const Post = sequelize.define('posts', {
  // ... fields
}, {
  paranoid: true,
  deletedAt: 'deletedAt'
});
```

## Common Database Operations

### 1. Raw Queries

```javascript
// Raw SQL query
const results = await sequelize.query(
  'SELECT * FROM posts WHERE userId = :userId',
  {
    replacements: { userId: 'user123' },
    type: QueryTypes.SELECT
  }
);
```

### 2. Transactions

```javascript
// Using transactions
const transaction = await sequelize.transaction();

try {
  const user = await User.create({ email, password }, { transaction });
  const post = await Post.create({ title, content, userId: user.id }, { transaction });
  
  await transaction.commit();
  return { user, post };
} catch (error) {
  await transaction.rollback();
  throw error;
}
```

### 3. Bulk Operations

```javascript
// Bulk insert
await Post.bulkCreate([
  { title: 'Post 1', content: 'Content 1', userId: 'user123' },
  { title: 'Post 2', content: 'Content 2', userId: 'user123' }
]);

// Bulk update
await Post.update(
  { status: 'published' },
  { where: { userId: 'user123' } }
);
```

### 4. Pagination

```javascript
// Paginated query
const { count, rows } = await Post.findAndCountAll({
  where: { userId: 'user123' },
  limit: 10,
  offset: 0,
  order: [['createdAt', 'DESC']]
});
```

## Troubleshooting

### 1. Migration Errors

```bash
# Check migration status
npx sequelize-cli db:migrate:status

# Fix failed migration
npx sequelize-cli db:migrate:undo
# Edit migration file
npx sequelize-cli db:migrate
```

### 2. Connection Issues

```bash
# Test database connection
node -e "
const sequelize = require('./config/database');
sequelize.authenticate()
  .then(() => console.log('Connection successful'))
  .catch(err => console.error('Connection failed:', err));
"
```

### 3. Seeder Dependencies

- Run seeders in correct order
- Check for foreign key dependencies
- Use proper error handling

### 4. Model Sync Issues

```javascript
// Force sync all models (development only)
await sequelize.sync({ force: true });

// Sync specific model
await Post.sync({ alter: true });
```