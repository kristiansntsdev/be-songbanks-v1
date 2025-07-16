# Architecture Guide

## Project Structure

```
songbanks-v1.1/
├── app/
│   ├── controllers/         # Request handlers
│   ├── middlewares/        # Custom middleware
│   └── models/             # Database models
├── config/
│   ├── database.js         # Database connection
│   ├── config.js          # Sequelize CLI config
│   └── swagger.js         # Swagger configuration
├── database/
│   ├── migrations/        # Database migrations
│   └── seeders/          # Database seeders
├── docs/                 # Documentation
├── routes/
│   └── api.js           # API routes
├── index.js             # Application entry point
├── Makefile            # Development commands
└── package.json        # Dependencies
```

## MVC Pattern

### Models (`app/models/`)
- Define database schema using Sequelize
- Handle data validation and relationships
- Example: `User.js`

### Controllers (`app/controllers/`)
- Handle HTTP requests and responses
- Contain business logic
- Call models for data operations
- Example: `UserController.js`, `AuthController.js`

### Routes (`routes/`)
- Define API endpoints
- Connect HTTP methods to controller actions
- Apply middleware (authentication, validation)
- Example: `api.js`

## Authentication Flow

```
Client Request → JWT Middleware → Controller → Model → Database
                      ↓
                 Verify Token
                      ↓
              Set req.user → Continue
                      ↓
                 Invalid Token → 401 Error
```

### JWT Implementation
1. **Login**: User provides email/password
2. **Token Generation**: Server creates JWT with user data
3. **Token Usage**: Client sends token in Authorization header
4. **Token Verification**: Middleware validates token on protected routes

## Database Architecture

### Connection
- Uses Sequelize ORM for database operations
- Connection configured in `config/database.js`
- Supports connection pooling and transactions

### Models
- Each model represents a database table
- Uses ULID for primary keys (better than auto-increment)
- Includes timestamps (createdAt, updatedAt)

### Migrations
- Version control for database schema
- Located in `database/migrations/`
- Run with `make migrate`

### Seeders
- Insert initial/sample data
- Located in `database/seeders/`
- Run with `make seed`

## Error Handling

### Centralized Error Controller
- `ErrorController.js` provides standardized error responses
- Handles different HTTP status codes
- Includes error logging

### Error Response Format
```json
{
  "error": "Error Type",
  "message": "Detailed error message",
  "statusCode": 400
}
```

## Middleware Architecture

### Authentication Middleware
- `auth.js` - JWT token verification
- Protects routes requiring authentication
- Sets `req.user` for authenticated requests

### Error Middleware
- Global error handler
- Catches and formats errors
- Logs errors for debugging

## Security Features

1. **JWT Authentication**: Stateless, secure token-based auth
2. **Password Security**: Raw passwords (upgrade to bcrypt recommended)
3. **CORS**: Cross-origin resource sharing
4. **Input Validation**: Request body validation
5. **Error Handling**: Secure error messages

## Scalability Considerations

1. **Stateless Design**: JWT tokens enable horizontal scaling
2. **Database Connection Pooling**: Efficient connection management
3. **Modular Architecture**: Easy to add new features
4. **Containerization**: Ready for Docker deployment
5. **API Documentation**: Swagger for team collaboration