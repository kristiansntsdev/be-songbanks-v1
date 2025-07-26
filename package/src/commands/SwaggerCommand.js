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
                if (controllerName === 'all') {
                    this.generateAll();
                } else {
                    this.generateByController(controllerName);
                }
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

    generateAll() {
        console.log('🚀 Generating routes and swagger for all controllers...');
        
        // Scan all controllers
        const allControllers = this.scanControllers();
        
        // Generate swagger and routes for the first controller to trigger full generation
        const firstController = Object.keys(allControllers)[0];
        if (firstController) {
            this.generateByController(firstController);
        }
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
        // Always create fresh swagger.json - scan all controllers and regenerate completely
        const allControllers = this.scanControllers();
        
        // Create fresh swagger spec
        const swaggerSpec = {
            "openapi": "3.0.0",
            "info": {
                "title": "SongBanks API",
                "description": "Auto-generated API documentation using Swagpress framework",
                "version": "1.0.0"
            },
            "servers": [
                {
                    "url": "http://localhost:3000/api",
                    "description": "Development server"
                },
                {
                    "url": "https://songbanks-v1-1.vercel.app/api",
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

        // Add base schemas first
        swaggerSpec.components.schemas = {
            ...swaggerSpec.components.schemas,
            ...this.getBaseSchemas()
        };

        // Generate routes for ALL controllers
        Object.keys(allControllers).forEach(currentControllerName => {
            const controller = allControllers[currentControllerName];
            
            // Add controller-specific schemas
            this.addControllerSchemas(swaggerSpec, currentControllerName);
            
            // Generate routes for this controller
            Object.keys(controller.methods).forEach(methodName => {
                const method = controller.methods[methodName];
                const routePath = method.endpointPath || this.generateRoutePath({
                    controller: currentControllerName,
                    method: methodName,
                    httpMethod: method.httpMethod
                });
                
                const route = {
                    controller: currentControllerName,
                    method: methodName,
                    httpMethod: method.httpMethod,
                    endpointPath: method.endpointPath,
                    path: routePath,
                    routerPath: routePath.replace('/api', ''),
                    fullMethodName: `${currentControllerName}.${methodName}`
                };

                const swaggerPath = this.routerPathToSwaggerPath(route.routerPath);
                
                if (!swaggerSpec.paths[swaggerPath]) {
                    swaggerSpec.paths[swaggerPath] = {};
                }
                
                swaggerSpec.paths[swaggerPath][route.httpMethod] = this.generateSwaggerOperation(route, currentControllerName);
            });
        });
        
        // Write completely fresh swagger.json
        fs.writeFileSync(this.outputPath, JSON.stringify(swaggerSpec, null, 2));
        
        const totalEndpoints = Object.keys(swaggerSpec.paths).reduce((total, path) => {
            return total + Object.keys(swaggerSpec.paths[path]).length;
        }, 0);
        
        console.log(`✅ Generated fresh swagger.json with ${totalEndpoints} total endpoints from ${Object.keys(allControllers).length} controllers`);
    }
    
    updateRoutesFile(controllerName, controllerRoutes) {
        // For complete rewrite, regenerate the entire routes file when any controller is processed
        this.generateCompleteRoutesFile();
    }

    generateCompleteRoutesFile() {
        console.log('🔄 Regenerating complete routes file...');
        
        // Scan all controllers to get complete picture
        const allControllers = this.scanControllers();
        
        // Organize controllers by groups and resources
        const groupedControllers = {};
        const resourceControllers = {};
        const ungroupedControllers = {};
        
        Object.keys(allControllers).forEach(controllerName => {
            const controller = allControllers[controllerName];
            
            // Check if controller has group or resource annotations
            let hasGroup = false;
            let hasResource = false;
            let groupName = null;
            let resourceName = null;
            
            Object.keys(controller.methods).forEach(methodName => {
                const method = controller.methods[methodName];
                if (method.annotations) {
                    if (method.annotations.group) {
                        hasGroup = true;
                        groupName = method.annotations.group;
                    }
                    if (method.annotations.resource) {
                        hasResource = true;
                        resourceName = method.annotations.resource;
                    }
                }
            });
            
            if (hasResource) {
                if (!resourceControllers[resourceName]) {
                    resourceControllers[resourceName] = [];
                }
                resourceControllers[resourceName].push({
                    controllerName,
                    controller
                });
            } else if (hasGroup) {
                if (!groupedControllers[groupName]) {
                    groupedControllers[groupName] = [];
                }
                groupedControllers[groupName].push({
                    controllerName,
                    controller
                });
            } else {
                ungroupedControllers[controllerName] = controller;
            }
        });
        
        // Generate routes file content
        let routesContent = this.generateRoutesFileHeader(Object.keys(allControllers));
        
        // Add resource routes
        Object.keys(resourceControllers).forEach(resourceName => {
            routesContent += this.generateResourceRoutes(resourceName, resourceControllers[resourceName]);
        });
        
        // Add grouped routes
        Object.keys(groupedControllers).forEach(groupName => {
            routesContent += this.generateGroupRoutes(groupName, groupedControllers[groupName]);
        });
        
        // Add ungrouped routes
        Object.keys(ungroupedControllers).forEach(controllerName => {
            routesContent += this.generateControllerRoutes(controllerName, ungroupedControllers[controllerName]);
        });
        
        // Add footer
        routesContent += '\nmodule.exports = router;\n';
        
        // Write the complete routes file
        fs.writeFileSync(this.routesPath, routesContent);
        
        console.log('✅ Generated complete routes file with groups and resources');
    }

    generateRoutesFileHeader(controllerNames) {
        let header = `const express = require('express');
const router = express.Router();
`;
        
        // Add controller imports
        controllerNames.forEach(controllerName => {
            header += `const ${controllerName} = require('../app/controllers/${controllerName}');\n`;
        });
        
        // Add middleware imports
        header += `const { authenticateToken } = require('../app/middlewares/auth');\n\n`;
        
        return header;
    }

    generateResourceRoutes(resourceName, resourceControllers) {
        let routesContent = `// ${resourceName} Resource Routes (RESTful CRUD)\n`;
        
        resourceControllers.forEach(({ controllerName, controller }) => {
            const resourcePath = `/${resourceName.toLowerCase()}s`;
            
            // Identify CRUD methods
            const crudMethods = this.identifyCrudMethods(controller.methods);
            
            if (this.isCrudController(crudMethods)) {
                // Generate standard RESTful routes
                routesContent += `// RESTful routes for ${resourceName}\n`;
                
                // Map CRUD methods to routes
                const routeMap = {
                    'index': { method: 'get', path: resourcePath },
                    'show': { method: 'get', path: `${resourcePath}/:id` },
                    'create': { method: 'post', path: resourcePath },
                    'update': { method: 'put', path: `${resourcePath}/:id` },
                    'destroy': { method: 'delete', path: `${resourcePath}/:id` }
                };
                
                crudMethods.forEach(crudMethod => {
                    if (routeMap[crudMethod]) {
                        const { method: httpMethod, path } = routeMap[crudMethod];
                        const methodName = this.findMethodForCrudAction(controller.methods, crudMethod);
                        if (methodName) {
                            routesContent += `router.${httpMethod}('${path}', ${controllerName}.${methodName});\n`;
                        }
                    }
                });
                
                routesContent += '\n';
            } else {
                // Generate individual routes
                Object.keys(controller.methods).forEach(methodName => {
                    const method = controller.methods[methodName];
                    const route = this.generateRouteFromMethod(controllerName, methodName, method);
                    if (route) {
                        routesContent += `${route}\n`;
                    }
                });
                routesContent += '\n';
            }
        });
        
        return routesContent;
    }

    generateGroupRoutes(groupName, groupControllers) {
        let routesContent = `// ${groupName} Group Routes\n`;
        
        groupControllers.forEach(({ controllerName, controller }) => {
            Object.keys(controller.methods).forEach(methodName => {
                const method = controller.methods[methodName];
                const route = this.generateRouteFromMethod(controllerName, methodName, method);
                if (route) {
                    routesContent += `${route}\n`;
                }
            });
        });
        
        routesContent += '\n';
        return routesContent;
    }

    generateControllerRoutes(controllerName, controller) {
        let routesContent = `// ${controllerName} Routes\n`;
        
        Object.keys(controller.methods).forEach(methodName => {
            const method = controller.methods[methodName];
            const route = this.generateRouteFromMethod(controllerName, methodName, method);
            if (route) {
                routesContent += `${route}\n`;
            }
        });
        
        routesContent += '\n';
        return routesContent;
    }

    generateRouteFromMethod(controllerName, methodName, method) {
        const httpMethod = method.httpMethod || this.inferHttpMethod(methodName);
        
        // Use explicit endpoint path if available, otherwise generate
        let routePath;
        if (method.annotations && method.annotations.endpointPath) {
            routePath = method.annotations.endpointPath.replace('/api', '');
        } else {
            routePath = this.generateRoutePath({
                controller: controllerName,
                method: methodName,
                httpMethod: httpMethod
            }).replace('/api', '');
        }
        
        return `router.${httpMethod}('${routePath}', ${controllerName}.${methodName});`;
    }

    findMethodForCrudAction(methods, crudAction) {
        // Find the actual method name that corresponds to a CRUD action
        const searchTerms = {
            'index': ['index', 'getall', 'list'],
            'show': ['show', 'getbyid', 'get'],
            'create': ['create', 'post', 'add'],
            'update': ['update', 'put', 'edit'],
            'destroy': ['destroy', 'delete', 'remove']
        };
        
        const terms = searchTerms[crudAction] || [];
        
        for (const methodName of Object.keys(methods)) {
            const lowerMethodName = methodName.toLowerCase();
            for (const term of terms) {
                if (lowerMethodName.includes(term)) {
                    return methodName;
                }
            }
        }
        
        return null;
    }

    identifyCrudMethods(methods) {
        const crudMapping = {
            'index': 'index',
            'show': 'show', 
            'create': 'create',
            'update': 'update',
            'destroy': 'destroy'
        };
        
        const foundMethods = [];
        Object.keys(methods).forEach(methodName => {
            const lowerMethod = methodName.toLowerCase();
            Object.keys(crudMapping).forEach(crudAction => {
                if (lowerMethod.includes(crudAction) || 
                    lowerMethod.includes(crudMapping[crudAction])) {
                    if (!foundMethods.includes(crudAction)) {
                        foundMethods.push(crudAction);
                    }
                }
            });
        });
        
        return foundMethods;
    }

    isCrudController(crudMethods) {
        // Consider it a CRUD controller if it has at least 3 CRUD methods
        return crudMethods.length >= 3;
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
            } else if (route.method === 'apiVerifyToken') {
                return { "$ref": "#/components/schemas/VerifyTokenRequest" };
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
            } else if (route.method === 'apiVerifyToken') {
                return { "$ref": "#/components/schemas/VerifyTokenResponse" };
            } else if (route.method === 'apiRefreshToken') {
                return { "$ref": "#/components/schemas/RefreshTokenResponse" };
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
            },
            "VerifyTokenRequest": {
                "type": "object",
                "required": ["token"],
                "properties": {
                    "token": {
                        "type": "string",
                        "example": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    }
                }
            },
            "VerifyTokenResponse": {
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
                                "example": "Token verified successfully"
                            },
                            "data": {
                                "type": "object",
                                "properties": {
                                    "user": {
                                        "$ref": "#/components/schemas/User"
                                    }
                                }
                            }
                        }
                    }
                ]
            },
            "RefreshTokenResponse": {
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
                                "example": "Token refreshed successfully"
                            },
                            "data": {
                                "type": "object",
                                "properties": {
                                    "token": {
                                        "type": "string",
                                        "example": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                                    }
                                }
                            }
                        }
                    }
                ]
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
        
        // Match both static async methods and static arrow function methods
        const lines = content.split('\n');
        let inJSDocBlock = false;
        let currentJSDoc = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Check for JSDoc comment blocks
            if (line.includes('/**')) {
                inJSDocBlock = true;
                currentJSDoc = [line];
                continue;
            }
            if (inJSDocBlock) {
                currentJSDoc.push(line);
                if (line.includes('*/')) {
                    inJSDocBlock = false;
                    // Keep JSDoc for the next method
                }
                continue;
            }
            
            // Skip if commented line
            if (line.startsWith('//')) {
                continue;
            }
            
            // Match static async methods: static async methodName(...)
            const asyncMethodMatch = line.match(/static\s+async\s+(\w+)\s*\([^)]*\)/);
            if (asyncMethodMatch) {
                const methodName = asyncMethodMatch[1];
                const annotations = this.parseJSDocAnnotations(currentJSDoc);
                
                methods[methodName] = {
                    name: methodName,
                    isAsync: true,
                    httpMethod: this.inferHttpMethod(methodName),
                    lineNumber: i + 1,
                    jsDoc: currentJSDoc.join('\n'),
                    annotations: annotations
                };
                currentJSDoc = [];
                continue;
            }
            
            // Match static arrow function methods: static MethodName = ErrorHandler.asyncHandler(async (req, res) =>
            const arrowMethodMatch = line.match(/static\s+(\w+)\s*=\s*ErrorHandler\.asyncHandler\s*\(\s*async/);
            if (arrowMethodMatch) {
                const methodName = arrowMethodMatch[1];
                const annotations = this.parseJSDocAnnotations(currentJSDoc);
                
                methods[methodName] = {
                    name: methodName,
                    isAsync: true,
                    httpMethod: this.inferHttpMethod(methodName),
                    lineNumber: i + 1,
                    jsDoc: currentJSDoc.join('\n'),
                    annotations: annotations
                };
                currentJSDoc = [];
                continue;
            }
            
            // Match other static methods: static methodName = 
            const staticMethodMatch = line.match(/static\s+(\w+)\s*=/);
            if (staticMethodMatch) {
                const methodName = staticMethodMatch[1];
                const annotations = this.parseJSDocAnnotations(currentJSDoc);
                
                methods[methodName] = {
                    name: methodName,
                    isAsync: false,
                    httpMethod: this.inferHttpMethod(methodName),
                    lineNumber: i + 1,
                    jsDoc: currentJSDoc.join('\n'),
                    annotations: annotations
                };
                currentJSDoc = [];
            }
        }
        
        return methods;
    }

    parseJSDocAnnotations(jsDocLines) {
        const annotations = {
            group: null,
            resource: null,
            summary: null,
            endpointPath: null
        };
        
        jsDocLines.forEach(line => {
            const trimmed = line.trim();
            
            // Extract @group annotation
            const groupMatch = trimmed.match(/@group\s+(\w+)/);
            if (groupMatch) {
                annotations.group = groupMatch[1];
            }
            
            // Extract @resource annotation  
            const resourceMatch = trimmed.match(/@resource\s+(\w+)/);
            if (resourceMatch) {
                annotations.resource = resourceMatch[1];
            }
            
            // Extract @summary annotation
            const summaryMatch = trimmed.match(/@summary\s+(.+)/);
            if (summaryMatch) {
                annotations.summary = summaryMatch[1];
            }
            
            // Extract endpoint path from comments like "GET /api/users"
            const pathMatch = trimmed.match(/^\*\s*(GET|POST|PUT|DELETE)\s+(\/[\/\w\-:]+)/);
            if (pathMatch) {
                annotations.endpointPath = pathMatch[2];
            }
            
            // Also check for paths in summary comments
            const summaryPathMatch = trimmed.match(/^\*\s*(GET|POST|PUT|DELETE)\s+(\/api\/[\/\w\-:]+)/);
            if (summaryPathMatch) {
                annotations.endpointPath = summaryPathMatch[2];
            }
        });
        
        return annotations;
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
        
        // Specific auth method mappings
        if (lowerMethod.includes('apilogin')) return 'post';
        if (lowerMethod.includes('apilogout')) return 'post';
        if (lowerMethod.includes('apiverifytoken')) return 'post';
        if (lowerMethod.includes('apirefreshtoken')) return 'post';
        if (lowerMethod.includes('apichangepassword')) return 'post';
        if (lowerMethod.includes('apiupdateprofile')) return 'put';
        
        // Specific playlist method mappings
        if (lowerMethod.includes('generateshareablelink')) return 'post';
        if (lowerMethod.includes('joinplaylistvialink')) return 'post';
        if (lowerMethod.includes('getsharedplaylistdetails')) return 'get';
        if (lowerMethod.includes('addsongtoplaylist')) return 'post';
        if (lowerMethod.includes('removesongfromplaylist')) return 'delete';
        if (lowerMethod.includes('reorderplaylistsongs')) return 'put';
        if (lowerMethod.includes('getuserplaylists')) return 'get';
        
        // Specific playlist team method mappings
        if (lowerMethod.includes('invitemembertoteam')) return 'post';
        if (lowerMethod.includes('updateteamvisibility')) return 'put';
        if (lowerMethod.includes('addmembertoteam')) return 'post';
        if (lowerMethod.includes('removememberfromteam')) return 'delete';
        if (lowerMethod.includes('updatememberrole')) return 'put';
        if (lowerMethod.includes('getuserteams')) return 'get';
        
        // Specific song method mappings
        if (lowerMethod.includes('addtagtosong')) return 'post';
        if (lowerMethod.includes('removetagfromsong')) return 'delete';
        
        // Other specific mappings
        if (lowerMethod.includes('requestvolaccess')) return 'post';
        
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
        
        // First check if there's an explicit endpoint path from JSDoc annotations
        if (route.annotations && route.annotations.endpointPath) {
            return route.annotations.endpointPath.replace('/api', '');
        }
        
        // Note-specific endpoints (MUST come before general patterns)
        if (method.includes('createnoteforsong') || method.includes('createnotefor')) {
            return `/api/notes/:user_id/:song_id`;
        }
        if (method.includes('getallusernotes') || method.includes('getalluser')) {
            return `/api/notes/:user_id`;
        }
        if (method.includes('getnotebyid') && controller === 'note') {
            return `/api/notes/:user_id/:id`;
        }
        if (method.includes('updatenote') && controller === 'note') {
            return `/api/notes/:user_id/:id`;
        }
        if (method.includes('deletenote') && controller === 'note') {
            return `/api/notes/:user_id/:id`;
        }
        if (method.includes('getrecentnotes')) {
            return `/api/notes`;
        }
        if (method.includes('createnote') && !method.includes('forsong')) {
            return `/api/notes`;
        }
        
        // Playlist-specific endpoints (MUST come before general patterns)
        if (controller === 'playlist') {
            if (method.includes('getuserplaylists')) {
                return `/api/users/:user_id/playlists`;
            }
            if (method.includes('addsongtoplaylist')) {
                return `/api/playlists/:id/songs/:song_id`;
            }
            if (method.includes('removesongfromplaylist')) {
                return `/api/playlists/:id/songs/:song_id`;
            }
            if (method.includes('reorderplaylistsongs')) {
                return `/api/playlists/:id/reorder`;
            }
            if (method.includes('generateshareablelink')) {
                return `/api/playlists/:id/share`;
            }
            if (method.includes('joinplaylistvialink')) {
                return `/api/playlists/join/:share_token`;
            }
            if (method.includes('getsharedplaylistdetails')) {
                return `/api/playlists/shared/:share_token`;
            }
        }
        
        // PlaylistTeam-specific endpoints
        if (controller === 'playlistteam') {
            if (method.includes('addmembertoteam')) {
                return `/api/playlistteams/:id/members`;
            }
            if (method.includes('removememberfromteam')) {
                return `/api/playlistteams/:id/members/:member_id`;
            }
            if (method.includes('updatememberrole')) {
                return `/api/playlistteams/:id/members/:member_id/role`;
            }
            if (method.includes('getuserteams')) {
                return `/api/users/:user_id/teams`;
            }
            if (method.includes('invitemembertoteam')) {
                return `/api/playlistteams/:id/invite`;
            }
            if (method.includes('updateteamvisibility')) {
                return `/api/playlistteams/:id/visibility`;
            }
        }
        
        // Song-specific endpoints
        if (controller === 'song') {
            if (method.includes('addtagtosong')) {
                return `/api/songs/:id/tags`;
            }
            if (method.includes('removetagfromsong')) {
                return `/api/songs/:id/tags/:tag_id`;
            }
        }
        
        // Special cases for other controllers
        if (method.includes('getuseraccess') || method.includes('updateuseraccess')) {
            return method.includes('update') ? `/api/users/:id` : `/api/admin/user-access`;
        }
        
        // Auth endpoints
        if (method.includes('apilogin')) {
            return `/api/auth/login`;
        }
        if (method.includes('apilogout')) {
            return `/api/auth/logout`;
        }
        if (method.includes('apiverifytoken')) {
            return `/api/auth/verify`;
        }
        if (method.includes('apirefreshtoken')) {
            return `/api/auth/refresh`;
        }
        if (method.includes('apichangepassword')) {
            return `/api/auth/change-password`;
        }
        if (method.includes('apiupdateprofile')) {
            return `/api/auth/profile`;
        }
        
        // Generate RESTful paths based on method patterns (fallback)
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