# Vercel Deployment Guide

This guide explains how to deploy the SongBanks API to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Database**: Set up a PostgreSQL database (recommended: Neon, Supabase, or Vercel Postgres)
3. **Git Repository**: Push your code to GitHub, GitLab, or Bitbucket

## Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/songbanks-api)

## Manual Deployment

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Configure Environment Variables

Set up the following environment variables in your Vercel dashboard or via CLI:

```bash
vercel env add NODE_ENV
# Enter: production

vercel env add SESSION_SECRET
# Enter: your-strong-jwt-secret

vercel env add PROD_DB_HOST
# Enter: your-postgres-host

vercel env add PROD_DB_PORT
# Enter: 5432

vercel env add PROD_DB_DATABASE
# Enter: your-database-name

vercel env add PROD_DB_USERNAME
# Enter: your-postgres-username

vercel env add PROD_DB_PASSWORD
# Enter: your-postgres-password

vercel env add PROD_DB_SSL
# Enter: require

vercel env add PROD_DB_URL
# Enter: postgresql://username:password@host:port/database?sslmode=require
```

### 4. Deploy

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Database Setup

### Option 1: Neon (Recommended)

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Set the `PROD_DB_URL` environment variable

### Option 2: Vercel Postgres

1. Go to your Vercel dashboard
2. Navigate to Storage → Create → Postgres
3. Create a new database
4. Copy the environment variables to your project

### Option 3: Supabase

1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string

## Migration

After deployment, run migrations:

```bash
# Using Vercel CLI
vercel env pull .env.local
npm run migrate

# Or set up GitHub Actions for automated migrations
```

## Configuration Files

### vercel.json

Configures Vercel deployment settings:

- Routes all requests to `/api/index.js`
- Sets production environment
- Configures function timeout

### api/index.js

Serverless-compatible Express app entry point:

- Exports Express app instead of calling `listen()`
- Loads environment variables
- Sets up routes and middleware

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify environment variables
   - Check SSL requirements
   - Ensure database allows external connections

2. **Function Timeout**
   - Increase `maxDuration` in `vercel.json`
   - Optimize database queries
   - Add connection pooling

3. **Static Files Not Loading**
   - Ensure files are in `public/` directory
   - Update paths in `vercel.json` if needed

### Debug Commands

```bash
# View deployment logs
vercel logs

# Check environment variables
vercel env ls

# Run locally with production settings
vercel dev
```

## API Endpoints

After deployment, your API will be available at:

- **Base URL**: `https://your-app.vercel.app`
- **API Documentation**: `https://your-app.vercel.app/api-docs`
- **API Endpoints**: `https://your-app.vercel.app/api/*`

## Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **JWT Secret**: Use a strong, unique secret
3. **Database**: Enable SSL and restrict access
4. **CORS**: Configure for your frontend domain only

## Monitoring

- View logs in Vercel dashboard
- Set up error monitoring (Sentry, etc.)
- Monitor database performance
- Set up uptime monitoring

## CI/CD

Connect your Git repository to Vercel for automatic deployments:

1. Import project in Vercel dashboard
2. Connect to GitHub/GitLab/Bitbucket
3. Configure build settings
4. Set up environment variables
5. Deploy automatically on push to main branch
