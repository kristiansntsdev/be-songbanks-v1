# Claude Development Rules

## Development Standards

**ALL CODE MUST FOLLOW** the established best practices documented in `docs/best-practice/development-guidelines.md`

This includes:
- **Development Flow**: Model → Service → Controller → Schema → Build process
- **Service Layer**: Static methods, transactions, error handling with statusCode
- **Controller Layer**: ErrorHandler.asyncHandler, comprehensive JSDoc with Swagger annotations
- **Schema Layer**: OpenAPI format in `/schemas/requests/` and `/schemas/responses/`
- **Build Process**: Run `npm run build` or `npm run vercel-build` before deployment

## Fix Implementation Rules

**EVERY FIX MUST CHECK DEVELOPMENT FLOW** - Don't act outside the development flow:
- Always follow: Model → Service → Controller → Schema → Build process
- If development flow doesn't work for current implementation, suggest alternative methods
- Never bypass or skip steps in the established flow
- Maintain consistency with existing codebase patterns

## Database Rules

**NEVER RUN DATABASE MIGRATIONS OR SEEDS** - This project uses an external/production database.

Instead of running:
- `npm run migrate`
- `npm run seed` 
- `sequelize-cli db:migrate`
- `sequelize-cli db:seed`

**Provide MariaDB/MySQL SQL commands** that the user can run manually on their database:

```sql
-- Example: Check if table exists
DESCRIBE tags;

-- Example: Create missing columns
ALTER TABLE tags ADD COLUMN createdAt DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE tags ADD COLUMN updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
```

## Development Commands

Safe commands to run:
- `npm run dev` - Start development server
- `npm run build` - Build the application
- `npm run lint` - Run linting
- `npm run swagpress:generate-api` - Generate API documentation
- `npm test` - Run tests

## Testing Database Issues

When encountering database column errors:
1. Provide SQL to check table structure: `DESCRIBE table_name;`
2. Provide SQL to add missing columns if needed
3. Never assume migrations have been run
4. Always provide manual SQL commands for database changes