# 🚀 Deployment Guide - cPanel Node.js

## Pre-Deployment Checklist

### 1. Database Setup
- [ ] Create MySQL database in cPanel
- [ ] Note database name, username, and password
- [ ] Ensure database is accessible from your application

### 2. File Upload
- [ ] Upload all project files to `/home/tahumeat/be-songbank.tahumeat.com/`
- [ ] Ensure `index.js` is in the root directory
- [ ] Upload `node_modules` OR let cPanel install dependencies

### 3. cPanel Node.js Configuration

**Application Settings:**
- **Node.js version**: `10.24.1` (or latest available)
- **Application mode**: `Production`
- **Application root**: `/home/tahumeat/be-songbank.tahumeat.com`
- **Application URL**: `be-songbank.tahumeat.com`
- **Application startup file**: `index.js`

**Environment Variables:**
```
NODE_ENV = production
PORT = 3000
SESSION_SECRET = your-strong-jwt-secret-key-here
DB_HOST = localhost
DB_PORT = 3306
DB_DATABASE = your_database_name
DB_USERNAME = your_db_username
DB_PASSWORD = your_db_password
```

### 4. Database Migration

After uploading files and configuring the app, run migrations:

```bash
# SSH into your hosting account or use cPanel terminal
cd /home/tahumeat/be-songbank.tahumeat.com
npm run migrate
npm run seed
```

### 5. Testing

Test your API endpoints:
- **API Docs**: `https://be-songbank.tahumeat.com/api-docs`
- **Login**: `POST https://be-songbank.tahumeat.com/api/login`
- **Health Check**: `GET https://be-songbank.tahumeat.com/api/health`

## Files to Upload

### Required Files:
```
/home/tahumeat/be-songbank.tahumeat.com/
├── app/                    # Controllers, models, middleware
├── config/                 # Database and swagger config
├── database/               # Migrations and seeders
├── routes/                 # API routes
├── index.js               # Main application file
├── package.json           # Dependencies
├── .sequelizerc           # Sequelize configuration
└── node_modules/          # Dependencies (optional)
```

### Optional Files (don't upload):
- `.env` (use environment variables instead)
- `docs/` (documentation)
- `Makefile` (development only)
- `README.md` (optional)

## Production Considerations

### 1. Security
- Use strong JWT secret
- Use environment variables for sensitive data
- Enable HTTPS in production
- Update CORS settings for production domain

### 2. Performance
- Set NODE_ENV to production
- Use production database
- Enable gzip compression
- Consider using PM2 for process management

### 3. Monitoring
- Set up error logging
- Monitor API performance
- Set up health checks
- Monitor database performance

## Troubleshooting

### Common Issues:

1. **Application won't start**
   - Check if `index.js` exists in application root
   - Verify environment variables are set
   - Check Node.js version compatibility

2. **Database connection errors**
   - Verify database credentials
   - Check if database exists
   - Ensure database is accessible from application

3. **Permission errors**
   - Check file permissions (755 for directories, 644 for files)
   - Ensure application has write access to required directories

4. **Module not found errors**
   - Run `npm install` in application directory
   - Check if all dependencies are listed in package.json

## Post-Deployment Steps

1. **Test all endpoints** using Swagger UI
2. **Monitor application logs** for errors
3. **Set up SSL certificate** for HTTPS
4. **Configure domain DNS** if needed
5. **Set up backup strategy** for database

## Support

If you encounter issues:
1. Check cPanel error logs
2. Review application logs
3. Verify environment variables
4. Test database connectivity
5. Contact hosting support if needed

## Production URLs

After successful deployment:
- **API Base URL**: `https://be-songbank.tahumeat.com/api`
- **Documentation**: `https://be-songbank.tahumeat.com/api-docs`
- **Login Endpoint**: `https://be-songbank.tahumeat.com/api/login`

## Default Credentials

- **Email**: `admin-test@gmail.com`
- **Password**: `admin`

**Important**: Change these credentials in production!