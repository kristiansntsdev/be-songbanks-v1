#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class SwaggerCommand {
    constructor() {
        this.modelsPath = path.join(process.cwd(), 'app/models');
        this.controllersPath = path.join(process.cwd(), 'app/controllers');
        this.routesPath = path.join(process.cwd(), 'routes/api.js');
        this.outputPath = path.join(process.cwd(), 'swagger/swagger.json');
        this.args = process.argv.slice(2);
    }

    execute() {
        if (this.args.length === 0) {
            this.showUsage();
            return;
        }

        const command = this.args[0];
        const controllerName = this.args[1];

        switch (command) {
            case 'generate':
                this.generateByController(controllerName);
                break;
            case 'list':
                this.listControllers();
                break;
            case 'help':
                this.showUsage();
                break;
            default:
                console.error(`❌ Unknown command: ${command}`);
                this.showUsage();
        }
    }

    showUsage() {
        console.log(`
🔧 Swagger Controller Generator

Usage:
  npm run swagger:controller generate <controller>  Generate Swagger docs for specific controller
  npm run swagger:controller list                  List all available controllers
  npm run swagger:controller help                  Show this help message

Examples:
  npm run swagger:controller generate TagController
  npm run swagger:controller generate UserController
  npm run swagger:controller list

Available controllers:`);
        this.listControllers(false);
    }

    listControllers(standalone = true) {
        if (standalone) {
            console.log('📋 Available Controllers:');
        }

        const controllers = this.scanControllers();
        
        Object.keys(controllers).forEach(controllerName => {
            const controller = controllers[controllerName];
            const methodCount = Object.keys(controller.methods).length;
            console.log(`  • ${controllerName} (${methodCount} methods)`);
            
            Object.keys(controller.methods).forEach(methodName => {
                const method = controller.methods[methodName];
                console.log(`    - ${method.httpMethod.toUpperCase()} ${methodName}()`);
            });
        });
    }

    generateByController(controllerName) {
        if (!controllerName) {
            console.error('❌ Controller name is required');
            this.showUsage();
            return;
        }

        console.log(`🔍 Generating Swagger docs for ${controllerName}...`);
        
        const controllers = this.scanControllers();
        
        if (!controllers[controllerName]) {
            console.error(`❌ Controller '${controllerName}' not found`);
            console.log('💡 Available controllers:');
            Object.keys(controllers).forEach(name => {
                console.log(`  • ${name}`);
            });
            return;
        }

        const controller = controllers[controllerName];
        
        // Generate routes for this specific controller
        const controllerRoutes = [];
        
        Object.keys(controller.methods).forEach(methodName => {
            const method = controller.methods[methodName];
            const routePath = method.endpointPath || this.generateRoutePath({
                controller: controllerName,
                method: methodName,
                httpMethod: method.httpMethod
            });
            
            controllerRoutes.push({
                controller: controllerName,
                method: methodName,
                httpMethod: method.httpMethod,
                endpointPath: method.endpointPath,
                path: routePath,
                routerPath: routePath.replace('/api', ''),
                fullMethodName: `${controllerName}.${methodName}`
            });
        });

        console.log(`📝 Found ${controllerRoutes.length} methods in ${controllerName}`);
        
        // Update swagger.json with controller documentation
        this.addControllerToSwagger(controllerName, controllerRoutes);
        
        // Update routes/api.js with simple route definitions
        this.updateRoutesFile(controllerName, controllerRoutes);
    }

    addControllerToSwagger(controllerName, controllerRoutes) {
        // Read current swagger.json
        let swaggerSpec;
        try {
            const swaggerContent = fs.readFileSync(this.outputPath, 'utf8');
            swaggerSpec = JSON.parse(swaggerContent);
        } catch (error) {
            // If file doesn't exist, create base structure
            swaggerSpec = {
                "openapi": "3.0.0",
                "info": {
                    "title": "SongBanks API",
                    "description": "API documentation for SongBanks application",
                    "version": "1.0.0"
                },
                "servers": [
                    {
                        "url": "http://localhost:3000/api",
                        "description": "Development server"
                    },
                    {
                        "url": "https://be-songbanks.tahumeat.com/api",
                        "description": "Production server"
                    }
                ],
                "components": {
                    "schemas": {},
                    "securitySchemes": {
                        "bearerAuth": {
                            "type": "http",
                            "scheme": "bearer",
                            "bearerFormat": "JWT"
                        }
                    }
                },
                "paths": {}
            };
        }
        
        // Add controller-specific schemas
        this.addControllerSchemas(swaggerSpec, controllerName);
        
        // Add or update paths for this controller
        controllerRoutes.forEach(route => {
            const swaggerPath = this.routerPathToSwaggerPath(route.routerPath);
            
            if (!swaggerSpec.paths[swaggerPath]) {
                swaggerSpec.paths[swaggerPath] = {};
            }
            
            swaggerSpec.paths[swaggerPath][route.httpMethod] = this.generateSwaggerOperation(route, controllerName);
        });
        
        // Write updated swagger.json
        fs.writeFileSync(this.outputPath, JSON.stringify(swaggerSpec, null, 2));
        
        console.log(`✅ Added ${controllerRoutes.length} ${controllerName} endpoints to swagger.json`);
    }
    
    updateRoutesFile(controllerName, controllerRoutes) {
        // Read current routes file
        const routesContent = fs.readFileSync(this.routesPath, 'utf8');
        
        // Check if controller is already imported
        const controllerImportPattern = new RegExp(`const ${controllerName} = require\\('\\.\\./app/controllers/${controllerName}'\\);`);
        let updatedContent = routesContent;
        
        if (!controllerImportPattern.test(routesContent)) {
            // Add import after the last controller import
            const lastImportMatch = routesContent.match(/const \w+Controller = require\('\.\./app/controllers/\w+Controller'\);/g);
            if (lastImportMatch) {
                const lastImport = lastImportMatch[lastImportMatch.length - 1];
                const lastImportIndex = routesContent.indexOf(lastImport) + lastImport.length;
                updatedContent = routesContent.slice(0, lastImportIndex) + 
                    `\nconst ${controllerName} = require('../app/controllers/${controllerName}');` +
                    routesContent.slice(lastImportIndex);
            }
        }
        
        // Remove existing routes for this controller
        const existingPattern = new RegExp(`router\\.[a-z]+\\('[^']*',\\s*${controllerName}\\.[a-zA-Z]+\\);`, 'g');
        const existingMatches = updatedContent.match(existingPattern) || [];
        
        if (existingMatches.length > 0) {
            console.log(`⚠️  Found ${existingMatches.length} existing ${controllerName} routes. Removing duplicates...`);
            
            existingMatches.forEach(routeMatch => {
                updatedContent = updatedContent.replace(routeMatch, '');
            });
        }
        
        // Add simple route definitions (no swagger docs)
        let routeDefinitions = '';
        controllerRoutes.forEach(route => {
            routeDefinitions += `router.${route.httpMethod}('${route.routerPath}', ${controllerName}.${route.method});\n`;
        });
        
        // Add the route definitions before module.exports
        const moduleExportsIndex = updatedContent.indexOf('module.exports = router;');
        if (moduleExportsIndex !== -1) {
            updatedContent = updatedContent.slice(0, moduleExportsIndex) + 
                routeDefinitions + '\n' +
                updatedContent.slice(moduleExportsIndex);
        }
        
        // Write updated content
        fs.writeFileSync(this.routesPath, updatedContent);
        
        console.log(`✅ Added ${controllerRoutes.length} ${controllerName} routes to api.js`);
    }

    routerPathToSwaggerPath(routerPath) {
        // Convert :param to {param} format for swagger
        return routerPath.replace(/:(\w+)/g, '{$1}');
    }

    generateSwaggerOperation(route, controllerName) {
        const tag = controllerName.replace('Controller', '');
        const hasPathParam = route.routerPath.includes(':');
        const pathParam = hasPathParam ? route.routerPath.match(/:(\w+)/)[1] : null;
        
        // Generate method-specific summaries and descriptions
        const { summary, description } = this.generateMethodSummaryAndDescription(route);
        
        const operation = {
            summary: summary,
            description: description,
            tags: [tag]
        };
        
        // Add parameters if needed
        if (hasPathParam) {
            operation.parameters = [
                {
                    in: "path",
                    name: pathParam,
                    required: true,
                    schema: {
                        type: "string"
                    },
                    description: pathParam === 'user_id' ? 'The user ID' : `The ${pathParam} parameter`
                }
            ];
        }
        
        // Add request body for POST/PUT methods
        if (route.httpMethod === 'post' || route.httpMethod === 'put') {
            operation.requestBody = {
                required: true,
                content: {
                    "application/json": {
                        schema: this.getRequestBodySchema(route, controllerName)
                    }
                }
            };
        }
        
        // Add security for routes that need authentication
        if (this.requiresAuthentication(route)) {
            operation.security = [
                {
                    "bearerAuth": []
                }
            ];
        }
        
        // Add responses
        operation.responses = this.generateResponses(route, controllerName);
        
        return operation;
    }

    requiresAuthentication(route) {
        // Check if route typically requires authentication
        const authRoutes = ['admin', 'logout'];
        return authRoutes.some(authRoute => route.routerPath.includes(authRoute));
    }

    getRequestBodySchema(route, controllerName) {
        // Use specific schemas for tag operations
        if (controllerName === 'TagController') {
            if (route.httpMethod === 'post') {
                return { "$ref": "#/components/schemas/CreateTagRequest" };
            } else if (route.httpMethod === 'put') {
                return { "$ref": "#/components/schemas/UpdateTagRequest" };
            }
        } else if (controllerName === 'UserController' && route.method === 'updateUserAccess') {
            return { "$ref": "#/components/schemas/UpdateUserAccessRequest" };
        } else if (controllerName === 'AuthController') {
            if (route.method === 'apiLogin') {
                return { "$ref": "#/components/schemas/LoginRequest" };
            }
        }
        
        // Generic request body for other controllers
        return {
            type: "object",
            properties: {
                data: {
                    type: "object",
                    description: "Request payload"
                }
            }
        };
    }

    generateResponses(route, controllerName) {
        const responses = {
            "200": {
                description: "Successful response",
                content: {
                    "application/json": {
                        schema: this.getResponseSchema(route, controllerName)
                    }
                }
            },
            "400": {
                description: "Bad request",
                content: {
                    "application/json": {
                        schema: {
                            "$ref": "#/components/schemas/BadRequestError"
                        }
                    }
                }
            },
            "500": {
                description: "Internal server error",
                content: {
                    "application/json": {
                        schema: {
                            "$ref": "#/components/schemas/InternalServerError"
                        }
                    }
                }
            }
        };

        // Add specific error responses based on the route
        if (controllerName === 'AuthController') {
            if (route.method === 'apiLogin') {
                responses["401"] = {
                    description: "Unauthorized - Invalid credentials",
                    content: {
                        "application/json": {
                            schema: {
                                "$ref": "#/components/schemas/UnauthorizedError"
                            }
                        }
                    }
                };
                responses["403"] = {
                    description: "Account access denied",
                    content: {
                        "application/json": {
                            schema: {
                                "$ref": "#/components/schemas/AccountAccessDeniedError"
                            }
                        }
                    }
                };
            } else if (route.method === 'apiLogout') {
                responses["401"] = {
                    description: "Unauthorized",
                    content: {
                        "application/json": {
                            schema: {
                                "$ref": "#/components/schemas/UnauthorizedError"
                            }
                        }
                    }
                };
            }
        } else if (controllerName === 'UserController') {
            responses["401"] = {
                description: "Unauthorized - Admin access required",
                content: {
                    "application/json": {
                        schema: {
                            "$ref": "#/components/schemas/UnauthorizedError"
                        }
                    }
                }
            };
            if (route.method === 'updateUserAccess') {
                responses["404"] = {
                    description: "User not found",
                    content: {
                        "application/json": {
                            schema: {
                                "$ref": "#/components/schemas/SimpleError"
                            }
                        }
                    }
                };
            }
        }

        return responses;
    }

    getResponseSchema(route, controllerName) {
        if (controllerName === 'TagController') {
            if (route.method === 'GetTags') {
                return { "$ref": "#/components/schemas/TagsResponse" };
            } else if (route.method === 'GetTagById' || route.method === 'CreateTag' || route.method === 'UpdateTag') {
                return { "$ref": "#/components/schemas/TagResponse" };
            } else if (route.method === 'DeleteTag') {
                return {
                    type: "object",
                    properties: {
                        message: {
                            type: "string",
                            example: "Tag deleted successfully"
                        }
                    }
                };
            }
        } else if (controllerName === 'AuthController') {
            if (route.method === 'apiLogin') {
                return { "$ref": "#/components/schemas/LoginResponse" };
            } else if (route.method === 'apiLogout') {
                return { "$ref": "#/components/schemas/LogoutResponse" };
            }
        } else if (controllerName === 'NoteController') {
            return { "$ref": "#/components/schemas/NotesResponse" };
        } else if (controllerName === 'UserController') {
            if (route.method === 'getUserAccess') {
                return { "$ref": "#/components/schemas/UserAccessResponse" };
            } else if (route.method === 'updateUserAccess') {
                return { "$ref": "#/components/schemas/UpdateUserAccessResponse" };
            }
        }
        
        // Default response
        return { "$ref": "#/components/schemas/BaseResponseWithData" };
    }

    addControllerSchemas(swaggerSpec, controllerName) {
        // Ensure base schemas exist
        if (!swaggerSpec.components.schemas.BaseResponse) {
            swaggerSpec.components.schemas = {
                ...swaggerSpec.components.schemas,
                ...this.getBaseSchemas()
            };
        }

        // Add controller-specific schemas
        if (controllerName === 'TagController') {
            swaggerSpec.components.schemas = {
                ...swaggerSpec.components.schemas,
                ...this.getTagSchemas()
            };
        } else if (controllerName === 'AuthController') {
            swaggerSpec.components.schemas = {
                ...swaggerSpec.components.schemas,
                ...this.getAuthSchemas()
            };
        } else if (controllerName === 'UserController') {
            swaggerSpec.components.schemas = {
                ...swaggerSpec.components.schemas,
                ...this.getUserSchemas()
            };
        } else if (controllerName === 'NoteController') {
            swaggerSpec.components.schemas = {
                ...swaggerSpec.components.schemas,
                ...this.getNoteSchemas()
            };
        }
    }

    getBaseSchemas() {
        return {
            "BaseResponse": {
                "type": "object",
                "properties": {
                    "code": {
                        "type": "integer",
                        "description": "HTTP status code"
                    },
                    "message": {
                        "type": "string",
                        "description": "Response message"
                    }
                }
            },
            "BaseResponseWithData": {
                "allOf": [
                    {
                        "$ref": "#/components/schemas/BaseResponse"
                    },
                    {
                        "type": "object",
                        "properties": {
                            "data": {
                                "type": "object",
                                "description": "Response data payload"
                            }
                        }
                    }
                ]
            },
            "BadRequestError": {
                "type": "object",
                "properties": {
                    "error": {
                        "type": "string",
                        "example": "Bad request"
                    },
                    "message": {
                        "type": "string",
                        "example": "Bad request"
                    },
                    "statusCode": {
                        "type": "integer",
                        "example": 400
                    }
                }
            },
            "UnauthorizedError": {
                "type": "object",
                "properties": {
                    "error": {
                        "type": "string",
                        "example": "Unauthorized"
                    },
                    "message": {
                        "type": "string",
                        "example": "Unauthorized"
                    },
                    "statusCode": {
                        "type": "integer",
                        "example": 401
                    }
                }
            },
            "InternalServerError": {
                "type": "object",
                "properties": {
                    "error": {
                        "type": "string",
                        "example": "Internal server error"
                    },
                    "message": {
                        "type": "string",
                        "example": "Internal server error"
                    },
                    "statusCode": {
                        "type": "integer",
                        "example": 500
                    }
                }
            },
            "SimpleError": {
                "type": "object",
                "properties": {
                    "code": {
                        "type": "integer",
                        "example": 400
                    },
                    "message": {
                        "type": "string",
                        "example": "Invalid status. Must be either \"active\" or \"suspend\""
                    }
                }
            },
            "AccountAccessDeniedError": {
                "type": "object",
                "properties": {
                    "code": {
                        "type": "integer",
                        "example": 403
                    },
                    "message": {
                        "type": "string",
                        "example": "Account access denied"
                    },
                    "error": {
                        "type": "string",
                        "example": "Your account status is inactive. Please contact administrator."
                    }
                }
            }
        };
    }

    getTagSchemas() {
        return {
            "Tag": {
                "type": "object",
                "properties": {
                    "id": {
                        "type": "string",
                        "example": "tag123"
                    },
                    "name": {
                        "type": "string",
                        "example": "Rock"
                    },
                    "description": {
                        "type": "string",
                        "example": "Rock music genre"
                    },
                    "createdAt": {
                        "type": "string",
                        "format": "date-time"
                    },
                    "updatedAt": {
                        "type": "string",
                        "format": "date-time"
                    }
                }
            },
            "CreateTagRequest": {
                "type": "object",
                "required": ["name"],
                "properties": {
                    "name": {
                        "type": "string",
                        "example": "Rock",
                        "description": "The name of the tag"
                    },
                    "description": {
                        "type": "string",
                        "example": "Rock music genre",
                        "description": "Optional description of the tag"
                    }
                }
            },
            "UpdateTagRequest": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "example": "Rock",
                        "description": "The name of the tag"
                    },
                    "description": {
                        "type": "string",
                        "example": "Rock music genre",
                        "description": "Optional description of the tag"
                    }
                }
            },
            "TagsResponse": {
                "type": "object",
                "properties": {
                    "message": {
                        "type": "string",
                        "example": "Get All Tags"
                    },
                    "data": {
                        "type": "array",
                        "items": {
                            "$ref": "#/components/schemas/Tag"
                        }
                    }
                }
            },
            "TagResponse": {
                "type": "object",
                "properties": {
                    "message": {
                        "type": "string",
                        "example": "Tag created successfully"
                    },
                    "data": {
                        "$ref": "#/components/schemas/Tag"
                    }
                }
            }
        };
    }

    getAuthSchemas() {
        return {
            "User": {
                "type": "object",
                "properties": {
                    "id": {
                        "type": "string",
                        "example": "user123"
                    },
                    "email": {
                        "type": "string",
                        "example": "user@example.com"
                    },
                    "role": {
                        "type": "string",
                        "enum": ["admin", "member"],
                        "example": "member"
                    },
                    "status": {
                        "type": "string",
                        "enum": ["active", "pending", "suspend", "request", "guest"],
                        "example": "active"
                    },
                    "is_admin": {
                        "type": "boolean",
                        "example": false,
                        "description": "Only present for admin users"
                    }
                }
            },
            "LoginRequest": {
                "type": "object",
                "required": ["email", "password"],
                "properties": {
                    "email": {
                        "type": "string",
                        "format": "email",
                        "example": "user@example.com"
                    },
                    "password": {
                        "type": "string",
                        "example": "password123"
                    }
                }
            },
            "LoginResponse": {
                "allOf": [
                    {
                        "$ref": "#/components/schemas/BaseResponseWithData"
                    },
                    {
                        "type": "object",
                        "properties": {
                            "code": {
                                "example": 200
                            },
                            "message": {
                                "example": "Login successful"
                            },
                            "data": {
                                "type": "object",
                                "properties": {
                                    "token": {
                                        "type": "string",
                                        "example": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                                    },
                                    "user": {
                                        "$ref": "#/components/schemas/User"
                                    }
                                }
                            }
                        }
                    }
                ]
            },
            "LogoutResponse": {
                "type": "object",
                "properties": {
                    "message": {
                        "type": "string",
                        "example": "Logout successful"
                    }
                }
            }
        };
    }

    getUserSchemas() {
        return {
            "UserAccessResponse": {
                "allOf": [
                    {
                        "$ref": "#/components/schemas/BaseResponseWithData"
                    },
                    {
                        "type": "object",
                        "properties": {
                            "code": {
                                "example": 200
                            },
                            "message": {
                                "example": "User access list retrieved successfully"
                            },
                            "data": {
                                "type": "object",
                                "properties": {
                                    "active_users": {
                                        "type": "array",
                                        "items": {
                                            "$ref": "#/components/schemas/User"
                                        }
                                    },
                                    "request_users": {
                                        "type": "array",
                                        "items": {
                                            "$ref": "#/components/schemas/User"
                                        }
                                    },
                                    "suspended_users": {
                                        "type": "array",
                                        "items": {
                                            "$ref": "#/components/schemas/User"
                                        }
                                    }
                                }
                            }
                        }
                    }
                ]
            },
            "UpdateUserAccessRequest": {
                "type": "object",
                "required": ["status"],
                "properties": {
                    "status": {
                        "type": "string",
                        "enum": ["active", "suspend"],
                        "example": "active"
                    }
                }
            },
            "UpdateUserAccessResponse": {
                "allOf": [
                    {
                        "$ref": "#/components/schemas/BaseResponseWithData"
                    },
                    {
                        "type": "object",
                        "properties": {
                            "code": {
                                "example": 200
                            },
                            "message": {
                                "example": "User access updated successfully"
                            },
                            "data": {
                                "type": "object",
                                "properties": {
                                    "id": {
                                        "type": "string",
                                        "example": "user123"
                                    },
                                    "status": {
                                        "type": "string",
                                        "example": "active"
                                    }
                                }
                            }
                        }
                    }
                ]
            }
        };
    }

    getNoteSchemas() {
        return {
            "Song": {
                "type": "object",
                "properties": {
                    "id": {
                        "type": "string",
                        "example": "song123"
                    },
                    "title": {
                        "type": "string",
                        "example": "Song Title"
                    },
                    "artist": {
                        "type": "string",
                        "example": "Artist Name"
                    }
                }
            },
            "Note": {
                "type": "object",
                "properties": {
                    "id": {
                        "type": "string",
                        "example": "note123"
                    },
                    "notes": {
                        "type": "string",
                        "example": "This is a note"
                    },
                    "createdAt": {
                        "type": "string",
                        "format": "date-time"
                    },
                    "updatedAt": {
                        "type": "string",
                        "format": "date-time"
                    },
                    "Song": {
                        "$ref": "#/components/schemas/Song"
                    }
                }
            },
            "NotesResponse": {
                "type": "object",
                "properties": {
                    "message": {
                        "type": "string",
                        "example": "Get All Notes"
                    },
                    "id": {
                        "type": "string",
                        "example": "user123"
                    },
                    "data": {
                        "type": "array",
                        "items": {
                            "$ref": "#/components/schemas/Note"
                        }
                    }
                }
            }
        };
    }

    generateMethodSummaryAndDescription(route) {
        const methodName = route.method;
        
        // Method-specific summaries based on common patterns
        const summaryMap = {
            'GetTags': { summary: 'Get all tags', description: 'Retrieve all available tags' },
            'GetTagById': { summary: 'Get tag by ID', description: 'Retrieve a specific tag by its ID' },
            'CreateTag': { summary: 'Create new tag', description: 'Create a new tag with name and description' },
            'UpdateTag': { summary: 'Update tag', description: 'Update an existing tag by ID' },
            'DeleteTag': { summary: 'Delete tag', description: 'Delete a tag by ID' },
            'GetNoteByUserId': { summary: 'Get notes by user ID', description: 'Retrieve all notes for a specific user' },
            'getUserAccess': { summary: 'Retrieve user access list', description: 'Get a list of users with their access status for admin management' },
            'updateUserAccess': { summary: 'Update user access status', description: 'Admin can update the status for a specific user (active or suspend)' },
            'apiLogin': { summary: 'User login', description: 'Authenticate user with email and password' },
            'apiLogout': { summary: 'User logout', description: 'Logout authenticated user' }
        };
        
        if (summaryMap[methodName]) {
            return summaryMap[methodName];
        }
        
        // Fallback to generic summaries
        const httpMethod = route.httpMethod.toUpperCase();
        return { 
            summary: `${httpMethod} ${route.routerPath}`, 
            description: `Auto-generated endpoint for ${route.fullMethodName}` 
        };
    }

    // Methods from original file
    scanControllers() {
        const controllers = {};
        
        if (!fs.existsSync(this.controllersPath)) {
            console.warn('⚠️  Controllers directory not found');
            return controllers;
        }
        
        const files = fs.readdirSync(this.controllersPath)
            .filter(file => file.endsWith('.js') && !file.includes('Error'));
        
        for (const file of files) {
            const controllerName = path.basename(file, '.js');
            const controllerPath = path.join(this.controllersPath, file);
            
            try {
                const content = fs.readFileSync(controllerPath, 'utf8');
                controllers[controllerName] = this.parseController(content, controllerName);
            } catch (error) {
                console.warn(`⚠️  Error parsing controller ${controllerName}: ${error.message}`);
            }
        }
        
        return controllers;
    }

    parseController(content, controllerName) {
        const controller = {
            name: controllerName,
            methods: this.extractControllerMethods(content)
        };
        
        return controller;
    }

    extractControllerMethods(content) {
        const methods = {};
        
        // Match static async methods that are NOT commented out
        const lines = content.split('\n');
        let inCommentBlock = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Check for comment blocks
            if (line.includes('/*') && !line.includes('*/')) {
                inCommentBlock = true;
                continue;
            }
            if (line.includes('*/')) {
                inCommentBlock = false;
                continue;
            }
            
            // Skip if in comment block
            if (inCommentBlock) {
                continue;
            }
            
            // Match static async methods
            const methodMatch = line.match(/static\s+async\s+(\w+)\s*\([^)]*\)/);
            if (methodMatch) {
                const methodName = methodMatch[1];
                
                methods[methodName] = {
                    name: methodName,
                    isAsync: true,
                    httpMethod: this.inferHttpMethod(methodName),
                    lineNumber: i + 1
                };
            }
        }
        
        return methods;
    }

    inferHttpMethod(methodName) {
        const methodMap = {
            'index': 'get',
            'show': 'get',
            'create': 'post',
            'update': 'put',
            'destroy': 'delete',
            'delete': 'delete'
        };
        
        const lowerMethod = methodName.toLowerCase();
        
        for (const [pattern, httpMethod] of Object.entries(methodMap)) {
            if (lowerMethod.includes(pattern)) {
                return httpMethod;
            }
        }
        
        if (lowerMethod.includes('get')) return 'get';
        if (lowerMethod.includes('post')) return 'post';
        if (lowerMethod.includes('put') || lowerMethod.includes('update')) return 'put';
        if (lowerMethod.includes('delete')) return 'delete';
        
        return 'get';
    }

    generateRoutePath(route) {
        const controller = route.controller.replace('Controller', '').toLowerCase();
        const method = route.method.toLowerCase();
        
        // Generate RESTful paths based on method patterns
        if (method.includes('getall') || method.includes('index')) {
            return `/api/${controller}s`;
        } else if (method.includes('getbyid') || method.includes('show')) {
            return `/api/${controller}s/:id`;
        } else if (method.includes('create') || method.includes('store')) {
            return `/api/${controller}s`;
        } else if (method.includes('update')) {
            return `/api/${controller}s/:id`;
        } else if (method.includes('delete') || method.includes('destroy')) {
            return `/api/${controller}s/:id`;
        }
        
        // Special cases
        if (method.includes('getuseraccess') || method.includes('updateuseraccess')) {
            return method.includes('update') ? `/api/admin/user-access/:user_id` : `/api/admin/user-access`;
        }
        if (method.includes('getnotebyuserid')) {
            return `/api/notes/:user_id`;
        }
        if (method.includes('apilogin')) {
            return `/api/auth/login`;
        }
        if (method.includes('apilogout')) {
            return `/api/auth/logout`;
        }
        
        // Default fallback
        return `/api/${controller}s`;
    }
}

// Run the command if this file is executed directly
if (require.main === module) {
    const generator = new SwaggerCommand();
    generator.execute();
}

module.exports = SwaggerCommand;