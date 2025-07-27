# 🚀 Deployment Checklist - be-songbank.tahumeat.com

## ✅ Pre-Upload Checklist

### 1. Files to Upload

- [ ] `app/` folder (controllers, models, middlewares)
- [ ] `config/` folder (database, swagger configs)
- [ ] `database/` folder (migrations, seeders)
- [ ] `routes/` folder (API routes)
- [ ] `index.js` (main application file)
- [ ] `package.json` (dependencies)
- [ ] `.sequelizerc` (Sequelize config)

### 2. Files NOT to Upload

- [ ] ❌ `node_modules/` (let cPanel install)
- [ ] ❌ `.env` (use environment variables instead)
- [ ] ❌ `docs/` (optional documentation)
- [ ] ❌ `Makefile` (development only)
- [ ] ❌ `.git/` (version control)

## 🔧 cPanel Configuration

### Node.js Application Settings

```
Node.js version: 10.24.1 (or latest available)
Application mode: Production
Application root: /home/tahumeat/be-songbank.tahumeat.com
Application URL: be-songbank.tahumeat.com
Application startup file: index.js
```

### Environment Variables to Add

```
NODE_ENV = production
PORT = 3000
SESSION_SECRET = SongBankSecretKey2024!@#
DB_HOST = localhost
DB_PORT = 3306
DB_DATABASE = tahumeat_songbanks
DB_USERNAME = tahumeat_songbanks
DB_PASSWORD = [your_db_password]
```

## 🗄️ Database Setup

### 1. Create MySQL Database in cPanel

- Database name: `tahumeat_songbanks`
- Username: `tahumeat_songbanks`
- Password: [create strong password]

### 2. After Upload, Run Migrations

```bash
# SSH into your hosting or use cPanel terminal
cd /home/tahumeat/be-songbank.tahumeat.com
npm install
npm run migrate
npm run seed
```

## 🧪 Testing URLs

After deployment, test these URLs:

- API Docs: https://be-songbank.tahumeat.com/api-docs
- Login: POST https://be-songbank.tahumeat.com/api/login
- Health: GET https://be-songbank.tahumeat.com/api

## 🔐 Default Login Credentials

- Email: admin-test@gmail.com
- Password: admin

## ⚠️ Important Notes

1. Upload files to the exact path: `/home/tahumeat/be-songbank.tahumeat.com/`
2. Make sure `index.js` is in the root directory
3. Set application mode to "Production"
4. Use environment variables instead of .env file
5. Test all endpoints after deployment
