# ES Modules Migration Checklist

**Status**: NOT STARTED  
**Progress**: 3/85 tasks completed  
**Last Updated**: Comprehensive project recheck completed - NO ES modules conversion has been done yet  

## Phase 1: Package Configuration (2/4) 
- [ ] Add `"type": "module"` to package.json
- [x] Update `vitest.config.js` for ES modules  
- [x] Update `eslint.config.js` for ES modules
- [ ] Update Sequelize config files in `config/`

## Phase 2: Database Layer (0/12)
- [ ] `app/models/User.js` - Convert to ES modules
- [ ] `app/models/Tag.js` - Convert to ES modules
- [ ] `app/models/Song.js` - Convert to ES modules  
- [ ] `app/models/Note.js` - Convert to ES modules
- [ ] `app/models/Playlist.js` - Convert to ES modules
- [ ] `app/models/PlaylistTeam.js` - Convert to ES modules
- [ ] `config/database.js` - Convert to ES modules
- [ ] `config/config.js` - Convert to ES modules
- [ ] Package engine core conversion (BaseModel, ModelFactory, concerns, exceptions)
- [ ] Package engine dependencies conversion (Schema, Blueprint, types, builders, operations, utils, schemas)  
- [ ] Update Sequelize model associations (working via ES module imports)
- [ ] Test database connections (all tests passing)

## Phase 3: Service Layer (0/7)
- [ ] `app/services/AuthService.js` - Convert to ES modules
- [ ] `app/services/UserService.js` - Convert to ES modules
- [ ] `app/services/TagService.js` - Convert to ES modules
- [ ] `app/services/SongService.js` - Convert to ES modules
- [ ] `app/services/NoteService.js` - Convert to ES modules
- [ ] `app/services/PlaylistService.js` - Convert to ES modules
- [ ] `app/services/PlaylistTeamService.js` - Convert to ES modules

## Phase 4: Controller Layer (0/7)
- [ ] `app/controllers/AuthController.js` - Convert to ES modules
- [ ] `app/controllers/UserController.js` - Convert to ES modules
- [ ] `app/controllers/TagController.js` - Convert to ES modules
- [ ] `app/controllers/SongController.js` - Convert to ES modules
- [ ] `app/controllers/NoteController.js` - Convert to ES modules
- [ ] `app/controllers/PlaylistController.js` - Convert to ES modules
- [ ] `app/controllers/PlaylistTeamController.js` - Convert to ES modules

## Phase 5: Middleware & Infrastructure (0/5)
- [ ] `app/middlewares/auth.js` - Convert to ES modules
- [ ] `app/middlewares/ErrorHandler.js` - Convert to ES modules
- [ ] `routes/api.js` - Convert to ES modules
- [ ] `index.js` - Convert to ES modules
- [ ] `api/index.js` - Convert to ES modules

## Phase 6: Testing (2/4)
- [x] Update `test/auth/auth.service.test.js`
- [x] Update `test/user/user.service.test.js`
- [ ] Fix `test/tag/tag.service.test.js` with proper ES module mocking
- [x] Update Vitest configuration

### Phase 6 Status:
⚠️ **Partially Complete**: Test files already use ES modules but are designed to test CommonJS modules
- test/auth/auth.service.test.js (✅ ES modules but tests CommonJS services)
- test/user/user.service.test.js (✅ ES modules but tests CommonJS services)
- vitest.config.js (✅ already configured for ES modules)
- tag service test doesn't exist

## Phase 7: Schema Files (0/20)
- [ ] `schemas/requests/Auth/LoginRequest.js`
- [ ] `schemas/requests/Auth/VerifyTokenRequest.js`
- [ ] `schemas/requests/Tag/CreateTagRequest.js`
- [ ] `schemas/requests/Tag/GetTagsRequest.js`
- [ ] `schemas/requests/User/RequestVolAccessRequest.js`
- [ ] `schemas/requests/User/UpdateUserAccessRequest.js`
- [ ] `schemas/responses/Auth/LoginResponse.js`
- [ ] `schemas/responses/Auth/LogoutResponse.js`
- [ ] `schemas/responses/Auth/RefreshTokenResponse.js`
- [ ] `schemas/responses/Auth/VerifyTokenResponse.js`
- [ ] `schemas/responses/Tag/CreateTagResponse.js`
- [ ] `schemas/responses/Tag/GetTagsResponse.js`
- [ ] `schemas/responses/Tag/TagResponse.js`
- [ ] `schemas/responses/User/RequestVolAccessResponse.js`
- [ ] `schemas/responses/User/UpdateUserAccessResponse.js`
- [ ] `schemas/responses/User/UserAccessResponse.js`
- [ ] Update schema index files
- [ ] Update package schema files if needed
- [ ] Test schema imports
- [ ] Verify Swagger generation works

## Phase 8: Database Files (0/15)
- [ ] `database/migrations/*.js` files
- [ ] `database/seeders/*.js` files  
- [ ] `database/factories/UserFactory.js`
- [ ] `database/factories/SongFactory.js`
- [ ] `database/factories/TagFactory.js`
- [ ] `database/factories/NoteFactory.js`
- [ ] Update factory imports
- [ ] Test migration execution
- [ ] Test seeder execution
- [ ] Test factory usage
- [ ] Update Sequelize CLI config
- [ ] Verify database operations
- [ ] Test foreign key constraints
- [ ] Test model associations
- [ ] Test query operations

## Phase 9: Validation & Testing (0/13)
- [ ] Run full test suite (target: 23+ tests passing)
- [ ] Test API endpoints manually
- [ ] Verify authentication flows
- [ ] Test CRUD operations for all entities
- [ ] Test error handling
- [ ] Verify middleware chains
- [ ] Test file uploads if applicable
- [ ] Check application startup
- [ ] Verify hot reloading in dev
- [ ] Test production build
- [ ] Performance verification
- [ ] Memory usage check
- [ ] Update documentation

---

## Conversion Reference

### Basic Patterns:
```javascript
// OLD: CommonJS
const express = require('express');
const UserService = require('./UserService');
module.exports = UserController;

// NEW: ES Modules
import express from 'express';
import UserService from './UserService.js';
export default UserController;
```

### Special Cases:
```javascript
// __dirname/__filename
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

// JSON imports  
import config from './config.json' assert { type: 'json' };

// Dynamic imports
const module = await import('./dynamic-module.js');
```

---

## Instructions for Claude Sessions

**IMPORTANT**: When working on migration tasks:
1. ✅ Complete the actual task
2. ✅ Mark the task as done in this file (change `[ ]` to `[x]`)
3. ✅ Update progress counter at top 
4. ✅ Update "Last Updated" with current date/task
5. ✅ Test that the change works before marking complete

**Example Update**:
```diff
- **Progress**: 5/85 tasks completed
+ **Progress**: 6/85 tasks completed  
- **Last Updated**: Completed UserService migration
+ **Last Updated**: Completed TagService migration

- [ ] `app/services/TagService.js` - Convert to ES modules
+ [x] `app/services/TagService.js` - Convert to ES modules
```