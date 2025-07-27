# Songbanks API Documentation

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Getting Started](#getting-started)
3. [API Development Guide](#api-development-guide)
4. [Database Management](#database-management)
5. [Swagger Documentation](#swagger-documentation)
6. [Make Commands](#make-commands)
7. [Project Structure](#project-structure)

## Architecture Overview

This is a REST API built with Node.js, Express, and MySQL using the MVC (Model-View-Controller) pattern.

### Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL
- **ORM**: Sequelize
- **Authentication**: JWT (JSON Web Tokens)
- **Documentation**: Swagger UI
- **Container**: Podman/Docker (for MySQL)

### Key Features

- JWT-based authentication
- RESTful API design
- Swagger API documentation
- Database migrations and seeders
- Error handling middleware
- ULID-based primary keys

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Podman or Docker
- MySQL client (optional)

### Installation

1. **Clone and install dependencies**:

```bash
git clone <repository>
cd songbanks-v1.1
npm install
```

2. **Setup environment**:

```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. **Start MySQL database**:

```bash
make songbank-db
```

4. **Run migrations and seeders**:

```bash
make migrate
make seed
```

5. **Start the server**:

```bash
npm start
```

6. **Access API documentation**:

```
http://localhost:3000/api-docs
```

## Quick Start Commands

```bash
# Setup database
make songbank-db

# Run migrations
make migrate

# Run seeders
make seed

# Create new migration
make migration:create name=create_posts

# Create new seeder
make seeder:create name=admin_users

# Create new controller
make controller:create name=PostController

# Create new model
make model:create name=Post

# Start development server
npm start
```

## Default Credentials

- **Email**: `admin-test@gmail.com`
- **Password**: `admin`

Use these credentials to login and get JWT token for testing protected endpoints.
