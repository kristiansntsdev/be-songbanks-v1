# 🎵 Songbanks API

A modern REST API built with Node.js, Express, and MySQL for managing music-related content. Features JWT authentication, Swagger documentation, and database migrations.

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Express](https://img.shields.io/badge/Express-4.21+-blue)
![MySQL](https://img.shields.io/badge/MySQL-8.0+-orange)
![JWT](https://img.shields.io/badge/Auth-JWT-red)
![Swagger](https://img.shields.io/badge/Docs-Swagger-brightgreen)

## ✨ Features

- 🔐 **JWT Authentication** - Secure token-based authentication
- 📚 **Swagger Documentation** - Interactive API documentation
- 🗄️ **Database Migrations** - Version-controlled database schema
- 🌱 **Database Seeders** - Sample data for development
- 🆔 **ULID Primary Keys** - Sortable, URL-safe unique identifiers
- 🛡️ **Error Handling** - Centralized error management
- 🐳 **Container Support** - Podman/Docker MySQL setup
- 🔧 **Make Commands** - Easy development workflow

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- Podman or Docker
- MySQL client (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd songbanks-v1.1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Start MySQL database**
   ```bash
   make songbank-db
   ```

5. **Run migrations and seeders**
   ```bash
   make migrate
   make seed
   ```

6. **Start the server**
   ```bash
   npm start
   ```

7. **Access API documentation**
   ```
   http://localhost:3000/api-docs
   ```

## 📖 API Documentation

The API documentation is available at `http://localhost:3000/api-docs` when the server is running.

### Default Credentials

- **Email**: `admin-test@gmail.com`
- **Password**: `admin`

### Authentication Flow

1. **Login** to get JWT token:
   ```bash
   POST /api/login
   {
     "email": "admin-test@gmail.com",
     "password": "admin"
   }
   ```

2. **Use token** in Authorization header:
   ```bash
   Authorization: Bearer <jwt_token>
   ```

## 🛠️ Development Commands

### Database Management
```bash
make songbank-db              # Create MySQL database container
make migrate                  # Run database migrations
make migrate:undo             # Undo last migration
make seed                     # Run database seeders
make seed:undo                # Undo database seeders
```

### Code Generation
```bash
make migration:create name=create_posts    # Create new migration
make seeder:create name=demo_posts         # Create new seeder
make controller:create name=PostController # Create new controller
make model:create name=Post                # Create new model
```

### Server Commands
```bash
make start                    # Start development server
make docs                     # Open API documentation
make help                     # Show all available commands
```

## 📁 Project Structure

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
│   ├── README.md         # Main documentation
│   ├── architecture.md   # Architecture guide
│   ├── api-development.md # API development guide
│   ├── swagger.md        # Swagger documentation
│   └── database.md       # Database management
├── routes/
│   └── api.js           # API routes
├── index.js             # Application entry point
├── Makefile            # Development commands
└── package.json        # Dependencies
```

## 🔧 Available Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/login` | User authentication | No |
| POST | `/api/logout` | User logout | Yes |
| POST | `/api/users` | Create new user | Yes |

## 📦 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL
- **ORM**: Sequelize
- **Authentication**: JWT (JSON Web Tokens)
- **Documentation**: Swagger UI
- **Container**: Podman/Docker (for MySQL)
- **Primary Keys**: ULID

## 🧪 Testing

Test the API using:
- **Swagger UI**: `http://localhost:3000/api-docs`
- **Postman**: Import the API collection
- **curl**: Command-line testing

Example curl command:
```bash
# Login
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin-test@gmail.com", "password": "admin"}'

# Create user (with token)
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"email": "new@example.com", "password": "password123"}'
```

## 📚 Documentation

Comprehensive documentation is available in the `docs/` folder:

- **[Main Documentation](docs/README.md)** - Getting started guide
- **[Architecture Guide](docs/architecture.md)** - System design and patterns
- **[API Development](docs/api-development.md)** - How to build APIs
- **[Swagger Guide](docs/swagger.md)** - API documentation
- **[Database Guide](docs/database.md)** - Migrations and seeders

## 🔒 Security Features

- **JWT Authentication**: Stateless, secure token-based auth
- **Input Validation**: Request body validation
- **Error Handling**: Secure error messages without sensitive data
- **CORS Support**: Cross-origin resource sharing
- **Environment Variables**: Secure configuration management

## 📋 Environment Variables

Create a `.env` file with the following variables:

```env
PORT=3000
SESSION_SECRET=your-jwt-secret-key

DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=songbanksdb
DB_USERNAME=songbank
DB_PASSWORD=songbank
```

## 🚀 Deployment

### Docker Deployment
```bash
# Build image
docker build -t songbanks-api .

# Run container
docker run -p 3000:3000 songbanks-api
```

### Production Checklist
- [ ] Update JWT secret in production
- [ ] Configure secure database credentials
- [ ] Set up proper logging
- [ ] Configure CORS for production domains
- [ ] Set up SSL/TLS certificates
- [ ] Configure environment-specific settings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built on Node.js and Express.js
- Sequelize ORM for database operations
- Swagger for API documentation
- JWT for authentication
- ULID for unique identifiers

---

**Happy coding! 🎉**

For questions or support, please check the documentation in the `docs/` folder or open an issue.