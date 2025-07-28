# Claude Development Instructions

This file contains important instructions for Claude sessions to maintain consistency and track progress across conversation limits.

## Project Overview
- **Project**: SongBanks v1.1 - Node.js/Express API with MySQL
- **Architecture**: RESTful API with Swagger documentation
- **Current State**: Mixed CommonJS (app) + ES modules (tests)
- **Goal**: Full ES modules migration for better scalability

## Essential Files to Monitor
1. **MIGRATE.md** - ES modules migration checklist (ALWAYS update when completing migration tasks)
2. **package.json** - Dependencies and scripts
3. **test/** - Test files (currently 23/23 passing)
4. **app/** - Main application code (models, services, controllers)

## Current Status
- ✅ Schema organization completed (by controller: Auth/, Tag/, User/)
- ✅ SwaggerCommand updated for nested schema loading
- ✅ Route generation fixed (Router annotations)
- ✅ JSDoc cleanup completed
- ✅ TagService tests working (interface verification approach)
- 🔄 **ES Modules Migration**: Ready to start (see MIGRATE.md)

## Critical Instructions for All Sessions

### 1. Migration Task Protocol
**MANDATORY**: When completing ANY migration task:
```markdown
1. ✅ Complete the actual code change
2. ✅ Test that it works (run tests, start app, etc.)
3. ✅ Update MIGRATE.md immediately:
   - Change `[ ]` to `[x]` for completed task
   - Update progress counter (e.g., 5/85 → 6/85)
   - Update "Last Updated" field
4. ✅ Update this CLAUDE.md file if needed
```

### 2. Testing Requirements
- **Always run tests** after changes: `npm test`
- **Target**: Maintain 23+ passing tests
- **TagService**: Use interface verification (not complex mocking)
- **Before migration**: Ensure baseline tests pass

### 3. File Patterns to Follow
```javascript
// ES Module Pattern (TARGET)
import express from 'express';
import UserService from './UserService.js';
export default UserController;

// CommonJS Pattern (CURRENT - being migrated)
const express = require('express');
const UserService = require('./UserService');
module.exports = UserController;
```

### 4. Key Project Patterns
- **Schema organization**: `schemas/{requests|responses}/{Controller}/` 
- **Dot notation**: `Auth.LoginRequest`, `Tag.CreateTagRequest`
- **Service methods**: Static class methods with proper error handling
- **JSDoc**: Go-style annotations (@Router, @Success, @Failure, @Body)

## Debugging Common Issues

### ES Module Migration Issues:
1. **Missing file extensions**: Add `.js` to imports
2. **__dirname/__filename**: Use `import.meta.url` pattern
3. **JSON imports**: Use `assert { type: 'json' }`
4. **Dynamic imports**: Use `await import()` instead of `require()`

### Test Issues:
- **Vitest + CommonJS**: Use interface verification for complex mocking
- **Mixed modules**: Vitest imports, mock CommonJS modules
- **Always verify**: Tests should pass before and after changes

### Sequelize Issues:
- **Model associations**: May need updates for ES imports
- **Config files**: Update for ES module syntax
- **CLI operations**: Verify migrations/seeders work

## Session Handoff Checklist

When a session is ending:
1. ✅ Update MIGRATE.md with any completed tasks
2. ✅ Run `npm test` to verify current state
3. ✅ Update this file with current status
4. ✅ Note any blockers or issues for next session

When a session is starting:
1. ✅ Read this file completely
2. ✅ Check MIGRATE.md for current progress
3. ✅ Run `npm test` to verify baseline
4. ✅ Continue from where previous session left off

## Quick Commands
```bash
# Test everything
npm test

# Run specific test
npm test -- test/tag/tag.service.test.js

# Start development server
npm run dev

# Generate Swagger docs
npm run swagpress:generate-api

# Database operations
npm run migrate
npm run seed
```

## Emergency Rollback
If migration breaks something:
1. 🚨 Stop immediately
2. 🚨 Check git status: `git status`
3. 🚨 Revert changes: `git checkout .` or `git reset --hard`
4. 🚨 Update MIGRATE.md with issue notes
5. 🚨 Run tests to verify rollback: `npm test`

---

**Last Updated**: Initial creation after TagService test fixes
**Next Priority**: Begin ES modules migration (Phase 1 in MIGRATE.md)