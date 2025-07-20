# Architecture Guide

## Project Overview

Songbanks is a **Swagpress Framework Demo Application** showcasing API-first development with beautiful Swagger documentation. This project demonstrates clean architecture patterns, JSDoc-based documentation generation, and modern Node.js API development practices.

## Project Structure

```
songbanks-v1.1/                    # Swagpress API Demo
├── app/                           # Application core
│   ├── controllers/               # API request handlers with JSDoc
│   │   ├── AuthController.js      # Authentication endpoints
│   │   ├── SongController.js      # Song management CRUD
│   │   ├── UserController.js      # User administration
│   │   ├── TagController.js       # Tag management
│   │   └── BaseController.js      # Common controller functionality
│   ├── models/                    # Database models (Sequelize)
│   │   ├── User.js               # User model with relationships
│   │   ├── Song.js               # Song model with tags
│   │   ├── Note.js               # User notes on songs
│   │   └── Tag.js                # Song categorization
│   ├── services/                  # Business logic layer
│   │   ├── AuthService.js        # Authentication business logic
│   │   ├── SongService.js        # Song operations and search
│   │   ├── UserService.js        # User management logic
│   │   └── FileService.js        # File upload/serving
│   └── middleware/                # HTTP middleware
│       ├── auth.js               # JWT authentication
│       ├── upload.js             # File upload handling
│       └── cors.js               # CORS configuration
├── config/                        # Configuration files
│   ├── app.js                    # Application settings
│   ├── database.js               # Database connection config
│   ├── storage.js                # File storage configuration
│   └── swagger.js                # Swagger UI configuration
├── database/                      # Database layer
│   ├── migrations/               # Database schema versions
│   ├── seeders/                  # Sample data insertion
│   └── factories/                # Model factories for testing
│       ├── UserFactory.js        # User test data generation
│       └── SongFactory.js        # Song test data generation
├── swagger/                       # Generated API documentation
│   ├── swagger.json              # Auto-generated OpenAPI spec
│   ├── swagger.yaml              # YAML version (optional)
│   └── schemas/                  # Generated model schemas
│       ├── User.json
│       ├── Song.json
│       └── Tag.json
├── routes/                        # API route definitions
│   └── api.js                    # All API endpoints
├── storage/                       # File storage & runtime files
│   ├── logs/                     # Application logs
│   ├── uploads/                  # User uploaded files
│   │   ├── songs/                # Audio files
│   │   ├── covers/               # Album covers
│   │   └── avatars/              # User avatars
│   ├── cache/                    # Application cache
│   └── public/                   # Publicly accessible files
├── tests/                         # Test suites
│   ├── api/                      # API endpoint tests
│   ├── services/                 # Service layer tests
│   └── models/                   # Model tests
├── docs/                          # Project documentation
│   ├── installation.md
│   ├── api-guide.md
│   └── examples/
├── package/                       # SWAGPRESS FRAMEWORK
│   ├── src/                      # Framework source code
│   ├── package.json              # Framework package.json
│   └── README.md                 # Framework documentation
├── index.js                       # API server entry point
├── package.json                   # Demo app dependencies
├── .env.example                   # Environment template
└── README.md                      # Demo application guide
```

## Architecture Patterns

### API-First Design
- **Pure API Focus**: No web routes, dedicated to API development
- **Swagger Documentation**: Auto-generated from JSDoc comments
- **RESTful Endpoints**: Clean, predictable API structure
- **JSON Responses**: Consistent response formatting

### Service Layer Pattern
- **Controllers**: Handle HTTP requests and responses
- **Services**: Contain business logic and complex operations
- **Models**: Database interactions and relationships
- **Separation of Concerns**: Clear boundaries between layers

### JSDoc Documentation System
- **Source Code Documentation**: JSDoc comments in controllers
- **Auto-Generation**: Swagger JSON generated from comments
- **Live Documentation**: Always up-to-date API specs
- **Interactive Testing**: Swagger UI for API exploration

## JSDoc Controller Documentation

Controllers use JSDoc format for automatic Swagger generation:

```javascript
/**
 * GetTags
 * @summary Get all tags
 * @description Retrieve all available tags for songs
 * @tags Tag
 * @accept json
 * @produce json
 * @success 200 {object} TagsResponse
 * @failure 400 {object} ErrorResponse
 * @router /api/tags [get]
 */
static async GetTags(req, res) {
    // Implementation
}
```

### JSDoc Annotations
- `@summary`: Brief endpoint description
- `@description`: Detailed explanation
- `@tags`: Group endpoints by domain
- `@param`: Request parameters
- `@success/@failure`: Response schemas
- `@security`: Authentication requirements
- `@router`: HTTP method and path

## Swagger Generation System

### Automatic Documentation
1. **JSDoc Parsing**: Framework scans controller comments
2. **Schema Generation**: Auto-generates OpenAPI schemas
3. **JSON Output**: Creates `swagger/swagger.json`
4. **UI Serving**: Swagger UI loads from generated JSON

### Generation Commands
```bash
npm run swagpress:make-migration
npm run swagpress:migrate
npm run swagpress:make-seeder
npm run swagpress:seeder       
npm run swagpress:generate     # Generate swagger.json
npm run swagpress:watch        # Auto-regenerate on changes
npm run dev                  # Start server with docs generation
```

### Swagger Directory Structure
```
swagger/
├── swagger.json             # Main OpenAPI specification
├── swagger.yaml             # YAML format (optional)
└── schemas/                 # Individual model schemas
    ├── User.json
    ├── Song.json
    └── Tag.json
```

## Database Architecture

### Enhanced Model Structure
Songbanks uses **Laravel-inspired Sequelize models** that provide rich functionality, clear organization, and professional development patterns.

### Model Organization
```javascript
// app/models/User.js - Enhanced structure
const { Sequelize, DataTypes } = require('sequelize');
const { ulid } = require('ulid');
const sequelize = require('../../config/database');

class User extends Sequelize.Model {
    // Configuration
    static get fillable() {
        return ['first_name', 'last_name', 'email', 'password', 'role', 'status'];
    }

    static get hidden() {
        return ['password'];
    }

    static get casts() {
        return {
            'id': 'string',
            'created_at': 'date',
            'updated_at': 'date'
        };
    }

    // Associations
    static associate(models) {
        this.hasMany(models.Song, { foreignKey: 'created_by', as: 'songs' });
        this.hasMany(models.Note, { foreignKey: 'user_id', as: 'notes' });
    }

    // Scopes
    static get scopes() {
        return {
            active: { where: { status: 'active' } },
            admins: { where: { role: 'admin' } }
        };
    }

    // Instance methods
    isAdmin() {
        return this.role === 'admin';
    }

    getFullName() {
        return `${this.first_name || ''} ${this.last_name || ''}`.trim();
    }

    // Static methods
    static async findByRole(role) {
        return this.findAll({ where: { role } });
    }
}

// Model initialization with enhanced schema
User.init({
    id: {
        type: DataTypes.STRING(26),
        primaryKey: true,
        defaultValue: () => ulid()
    },
    first_name: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
    },
    role: {
        type: DataTypes.ENUM('admin', 'member', 'guest'),
        defaultValue: 'member'
    }
    // ... other fields
}, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    indexes: [
        { unique: true, fields: ['email'] },
        { fields: ['role'] },
        { fields: ['status'] }
    ],
    defaultScope: {
        attributes: { exclude: ['password'] }
    }
});
```

### Model Features

#### **Laravel-Inspired Patterns**
- **Fillable Arrays**: Define mass-assignable attributes
- **Hidden Attributes**: Exclude sensitive data from JSON output
- **Attribute Casting**: Automatic type conversion
- **Model Scopes**: Reusable query constraints
- **Relationships**: Clean association definitions

#### **Enhanced Functionality**
- **Instance Methods**: Business logic attached to model instances
- **Static Methods**: Class-level utility functions
- **Validation Rules**: Built-in data validation
- **Default Scopes**: Automatic query filtering
- **Query Builders**: Chainable query methods

#### **Professional Organization**
- **Clear Structure**: Logical grouping of model concerns
- **Self-Documenting**: Method names indicate functionality
- **Maintainable**: Easy to extend and modify
- **Testable**: Clean separation for unit testing

### Data Models

#### **User Model**
```javascript
// Enhanced user management with roles and relationships
class User extends Sequelize.Model {
    // Properties: id, first_name, last_name, email, role, status
    // Methods: isAdmin(), getFullName(), findByRole()
    // Relations: songs, notes, profile
}
```

#### **Song Model**  
```javascript
// Music track management with metadata and relationships
class Song extends Sequelize.Model {
    // Properties: id, title, artist, album, base_chord, lyrics_and_chords
    // Methods: search(), getFormattedDuration(), addTags()
    // Relations: creator, tags, notes
}
```

#### **Tag Model**
```javascript
// Categorization system for songs
class Tag extends Sequelize.Model {
    // Properties: id, name, description, color
    // Methods: findPopular(), getUsageCount()
    // Relations: songs
}
```

#### **Note Model**
```javascript
// User annotations and comments on songs
class Note extends Sequelize.Model {
    // Properties: id, content, user_id, song_id
    // Methods: getExcerpt(), isOwner()
    // Relations: user, song
}
```

### Database Features
- **ULID Primary Keys**: Better than auto-increment integers
- **Comprehensive Indexing**: Optimized query performance
- **Relationship Integrity**: Foreign key constraints
- **Timestamps**: Automatic createdAt/updatedAt
- **Soft Deletes**: Data preservation with deletion flags
- **Query Optimization**: Strategic index placement

## Authentication Flow

```
API Request → CORS → Auth Middleware → Controller → Service → Model → Database
                            ↓
                      JWT Verification
                            ↓
                    req.user = payload → Continue
                            ↓
                     Invalid Token → 401 Error
```

### JWT Implementation
1. **Login**: User credentials validation
2. **Token Generation**: JWT with user payload
3. **Token Transmission**: Authorization header
4. **Token Verification**: Middleware validation
5. **Protected Routes**: Access control

## File Storage System

### Storage Organization
- **uploads/**: User-uploaded files
- **public/**: Publicly accessible files
- **cache/**: Temporary application data
- **logs/**: Application logging

### File Serving
- **API Endpoints**: `/api/files/:type/:filename`
- **Upload Handling**: Multer middleware
- **Security**: File type validation
- **Organization**: Type-based directories

## Error Handling

### Centralized Error Management
- **ErrorController**: Standardized error responses
- **HTTP Status Codes**: Proper status code usage
- **Error Logging**: Debugging and monitoring
- **Consistent Format**: Predictable error structure

### Error Response Format
```json
{
  "error": "ValidationError",
  "message": "Invalid input data",
  "statusCode": 400,
  "details": {
    "field": "email",
    "issue": "Invalid email format"
  }
}
```

## API Development Workflow

### Development Process
1. **Design API**: Define endpoints and schemas
2. **Write Controllers**: Add JSDoc documentation
3. **Generate Docs**: Run `npm run swagger:generate`
4. **Test API**: Use Swagger UI for testing
5. **Iterate**: Refine based on testing

### Documentation Workflow
1. **JSDoc Comments**: Document in controller code
2. **Auto-Generation**: Framework creates swagger.json
3. **Live Updates**: Documentation stays current
4. **Interactive Testing**: Swagger UI for exploration

## Testing Strategy

### Test Organization
- **API Tests**: Endpoint functionality testing
- **Service Tests**: Business logic validation
- **Model Tests**: Database interaction testing
- **Integration Tests**: Full workflow testing

### Test Tools
- **Jest**: Testing framework
- **Supertest**: API endpoint testing
- **Factory Pattern**: Test data generation using model factories
- **Mock Data**: Realistic test scenarios

### Model Testing Examples
```javascript
// tests/models/User.test.js
describe('User Model', () => {
    test('should create user with valid data', async () => {
        const userData = UserFactory.build();
        const user = await User.create(userData);
        expect(user.isAdmin()).toBe(false);
        expect(user.getFullName()).toContain(userData.first_name);
    });

    test('should find users by role', async () => {
        await User.createAdmin({ email: 'admin@test.com' });
        const admins = await User.findByRole('admin');
        expect(admins.length).toBeGreaterThan(0);
        expect(admins[0].isAdmin()).toBe(true);
    });
});
```

## Security Features

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication
- **Bearer Token**: Standard authorization header
- **Token Expiration**: Security through time limits
- **Role-Based Access**: Admin/user permissions

### Data Protection
- **Input Validation**: Request data sanitization
- **SQL Injection Prevention**: ORM protection
- **CORS Configuration**: Cross-origin security
- **Error Message Security**: Information disclosure prevention

## Scalability Considerations

### Performance Optimization
- **Database Indexing**: Query optimization
- **Connection Pooling**: Efficient database connections
- **Caching Strategy**: Reduced database load
- **File Storage**: Efficient file serving

### Architecture Benefits
- **Stateless Design**: Horizontal scaling capability
- **Microservice Ready**: Service layer separation
- **Container Friendly**: Docker deployment ready
- **Load Balancer Compatible**: No session dependencies

## Development Experience

### Developer Tools
- **Auto-Generated Docs**: Always current API documentation
- **Interactive Testing**: Swagger UI for API exploration
- **Hot Reloading**: Development server with auto-restart
- **Rich CLI**: Framework commands for scaffolding

### Framework Features
- **Convention over Configuration**: Sensible defaults
- **Code Generation**: Automated boilerplate creation
- **Documentation First**: JSDoc-driven development
- **Beautiful Output**: Clean, professional API docs

### Model Development Workflow
1. **Create Migration**: Define database schema
2. **Generate Model**: Use enhanced Laravel-inspired structure
3. **Add Relationships**: Define model associations
4. **Create Factory**: Generate test data
5. **Write Tests**: Validate model functionality
6. **Implement Methods**: Add business logic

### Code Quality Benefits
- **Readable Code**: Self-documenting model structure
- **Maintainable Logic**: Clear separation of concerns
- **Testable Units**: Isolated functionality
- **Professional Standards**: Industry best practices
- **Team Consistency**: Standardized patterns

This architecture demonstrates how the **Swagpress Framework** enables rapid API development with enhanced Laravel-inspired models, beautiful automatically generated documentation, and professional code organization that scales with team growth.