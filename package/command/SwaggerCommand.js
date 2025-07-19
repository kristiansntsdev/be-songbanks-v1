const fs = require('fs');
const path = require('path');

class SwaggerCommand {
    constructor() {
        this.modelsPath = path.join(process.cwd(), 'app/models');
        this.controllersPath = path.join(process.cwd(), 'app/controllers');
        this.routesPath = path.join(process.cwd(), 'routes/api.js');
        this.outputPath = path.join(process.cwd(), 'docs/swagger');
    }

    execute() {
        console.log('🔍 Scanning controllers for active methods...');
        
        const controllers = this.scanControllers();
        const routes = this.scanRoutes();
        const activeControllerMethods = this.getActiveControllerMethods(controllers);
        
        console.log(`🎛️  Found ${Object.keys(controllers).length} controllers`);
        console.log(`🛣️  Found ${routes.length} existing routes`);
        console.log(`✅ Found ${activeControllerMethods.length} active controller methods`);
        
        console.log('📝 Generating @swagger documentation blocks...');
        this.generateSwaggerBlocks(activeControllerMethods, routes);
        
        console.log('✅ Swagger documentation blocks generated and injected into routes/api.js');
    }

    scanModels() {
        const models = {};
        
        if (!fs.existsSync(this.modelsPath)) {
            console.warn('⚠️  Models directory not found');
            return models;
        }
        
        const files = fs.readdirSync(this.modelsPath)
            .filter(file => file.endsWith('.js') && !file.includes('index'));
        
        for (const file of files) {
            const modelName = path.basename(file, '.js');
            const modelPath = path.join(this.modelsPath, file);
            
            try {
                const content = fs.readFileSync(modelPath, 'utf8');
                models[modelName] = this.parseModel(content, modelName);
            } catch (error) {
                console.warn(`⚠️  Error parsing model ${modelName}: ${error.message}`);
            }
        }
        
        return models;
    }

    parseModel(content, modelName) {
        const model = {
            name: modelName,
            tableName: this.extractTableName(content),
            fields: this.extractFields(content)
        };
        
        return model;
    }

    extractTableName(content) {
        const match = content.match(/sequelize\.define\(['"`]([^'"`]+)['"`]/);
        return match ? match[1] : null;
    }

    extractFields(content) {
        const fields = {};
        
        // Extract field definitions between the sequelize.define() braces
        const defineMatch = content.match(/sequelize\.define\([^{]+\{([^}]+)\}/s);
        if (!defineMatch) return fields;
        
        const fieldsContent = defineMatch[1];
        
        // Match field definitions
        const fieldMatches = fieldsContent.match(/(\w+):\s*\{[^}]+\}/g);
        if (!fieldMatches) return fields;
        
        for (const fieldMatch of fieldMatches) {
            const fieldName = fieldMatch.match(/(\w+):/)[1];
            const fieldDef = fieldMatch.match(/\{([^}]+)\}/)[1];
            
            fields[fieldName] = {
                type: this.extractFieldType(fieldDef),
                allowNull: this.extractAllowNull(fieldDef),
                primaryKey: fieldDef.includes('primaryKey: true'),
                references: this.extractReferences(fieldDef)
            };
        }
        
        return fields;
    }

    extractFieldType(fieldDef) {
        const typeMatch = fieldDef.match(/type:\s*DataTypes\.(\w+)(?:\(([^)]+)\))?/);
        if (!typeMatch) return 'string';
        
        const baseType = typeMatch[1];
        const typeParam = typeMatch[2];
        
        const typeMap = {
            'STRING': 'string',
            'TEXT': 'string',
            'INTEGER': 'integer',
            'BIGINT': 'integer',
            'BOOLEAN': 'boolean',
            'DATE': 'string',
            'ARRAY': 'array',
            'ENUM': 'string'
        };
        
        return typeMap[baseType] || 'string';
    }

    extractAllowNull(fieldDef) {
        const match = fieldDef.match(/allowNull:\s*(true|false)/);
        return match ? match[1] === 'true' : true;
    }

    extractReferences(fieldDef) {
        const match = fieldDef.match(/references:\s*\{[^}]*model:\s*['"`]([^'"`]+)['"`][^}]*\}/);
        return match ? match[1] : null;
    }

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
                
                // Look for endpoint comment in the previous line
                const prevLine = i > 0 ? lines[i - 1].trim() : '';
                const endpointComment = this.parseEndpointComment(prevLine);
                
                methods[methodName] = {
                    name: methodName,
                    isAsync: true,
                    httpMethod: endpointComment.method || this.inferHttpMethod(methodName),
                    endpointPath: endpointComment.path,
                    lineNumber: i + 1
                };
            }
        }
        
        return methods;
    }

    parseEndpointComment(commentLine) {
        // Parse comments like: // GET /api/notes/:user_id
        const match = commentLine.match(/\/\/\s*(GET|POST|PUT|DELETE|PATCH)\s+(.+)/i);
        if (match) {
            return {
                method: match[1].toLowerCase(),
                path: match[2].trim()
            };
        }
        return { method: null, path: null };
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

    scanRoutes() {
        const routes = [];
        
        if (!fs.existsSync(this.routesPath)) {
            console.warn('⚠️  Routes file not found');
            return routes;
        }
        
        try {
            const content = fs.readFileSync(this.routesPath, 'utf8');
            const routeMatches = content.match(/router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g);
            
            if (routeMatches) {
                for (const routeMatch of routeMatches) {
                    const [, method, path] = routeMatch.match(/router\.(\w+)\s*\(\s*['"`]([^'"`]+)['"`]/);
                    routes.push({
                        method: method.toLowerCase(),
                        path: path,
                        fullPath: `/api${path}`
                    });
                }
            }
        } catch (error) {
            console.warn(`⚠️  Error parsing routes: ${error.message}`);
        }
        
        return routes;
    }

    getActiveControllerMethods(controllers) {
        const activeControllerMethods = [];
        
        for (const [controllerName, controller] of Object.entries(controllers)) {
            for (const [methodName, method] of Object.entries(controller.methods)) {
                activeControllerMethods.push({
                    controller: controllerName,
                    method: methodName,
                    httpMethod: method.httpMethod,
                    endpointPath: method.endpointPath,
                    fullMethodName: `${controllerName}.${methodName}`
                });
            }
        }
        
        return activeControllerMethods;
    }

    generateSwaggerBlocks(activeControllerMethods, existingRoutes) {
        console.log('🔄 Rewriting routes/api.js with all active controller methods...');
        
        // Generate routes for all active controller methods
        const allRoutes = [];
        
        for (const activeMethod of activeControllerMethods) {
            // Use endpoint path from comment if available, otherwise generate
            const routePath = activeMethod.endpointPath || this.generateRoutePath(activeMethod);
            allRoutes.push({
                ...activeMethod,
                path: routePath,
                routerPath: routePath.replace('/api', '')
            });
        }
        
        // Generate complete new routes file
        const newRoutesContent = this.generateCompleteRoutesFile(allRoutes);
        
        // Write new routes file
        fs.writeFileSync(this.routesPath, newRoutesContent);
        
        console.log(`📝 Rewrote routes/api.js with ${allRoutes.length} swagger documentation blocks`);
    }

    generateRoutePath(activeMethod) {
        const controller = activeMethod.controller.replace('Controller', '').toLowerCase();
        const method = activeMethod.method.toLowerCase();
        
        // Generate path based on method name
        if (method === 'index') {
            return `/api/${controller}`;
        } else if (method === 'show' || method === 'update' || method === 'destroy') {
            return `/api/${controller}/:id`;
        } else if (method === 'create') {
            return `/api/${controller}`;
        } else if (method.includes('byuserid')) {
            return `/api/${controller}/:user_id`;
        } else {
            return `/api/${controller}/${method}`;
        }
    }

    generateSwaggerBlock(route) {
        const tag = route.controller.replace('Controller', '');
        const hasPathParam = route.routerPath.includes(':');
        const pathParam = hasPathParam ? route.routerPath.match(/:(\w+)/)[1] : null;
        
        // Convert :param to {param} format for swagger
        const swaggerPath = route.path.replace(/:(\w+)/g, '{$1}');
        
        let swaggerBlock = `/**\n * @swagger\n * ${swaggerPath}:\n *   ${route.httpMethod}:\n`;
        
        // Generate better summaries and descriptions based on method
        if (route.fullMethodName.includes('apiLogin')) {
            swaggerBlock += ` *     summary: User login\n`;
            swaggerBlock += ` *     description: Authenticate user with email and password\n`;
        } else if (route.fullMethodName.includes('apiLogout')) {
            swaggerBlock += ` *     summary: User logout\n`;
            swaggerBlock += ` *     description: Logout authenticated user\n`;
        } else if (route.fullMethodName.includes('getUserAccess')) {
            swaggerBlock += ` *     summary: Retrieve user access list\n`;
            swaggerBlock += ` *     description: Get a list of users with their access status for admin management\n`;
        } else if (route.fullMethodName.includes('updateUserAccess')) {
            swaggerBlock += ` *     summary: Update user access status\n`;
            swaggerBlock += ` *     description: Admin can update the status for a specific user (active or suspend)\n`;
        } else if (route.fullMethodName.includes('GetNoteByUserId')) {
            swaggerBlock += ` *     summary: Get notes by user ID\n`;
            swaggerBlock += ` *     description: Retrieve all notes for a specific user\n`;
        } else {
            swaggerBlock += ` *     summary: ${route.httpMethod.toUpperCase()} ${route.routerPath}\n`;
            swaggerBlock += ` *     description: Auto-generated endpoint for ${route.fullMethodName}\n`;
        }
        
        swaggerBlock += ` *     tags: [${tag}]\n`;
        
        // Add security for authenticated endpoints (not for login)
        if (!route.fullMethodName.includes('apiLogin') && 
            (route.httpMethod !== 'get' || route.fullMethodName.includes('getUserAccess'))) {
            swaggerBlock += ` *     security:\n *       - bearerAuth: []\n`;
        }
        
        // Add path parameters
        if (hasPathParam) {
            swaggerBlock += ` *     parameters:\n`;
            swaggerBlock += ` *       - in: path\n`;
            swaggerBlock += ` *         name: ${pathParam}\n`;
            swaggerBlock += ` *         required: true\n`;
            swaggerBlock += ` *         schema:\n`;
            swaggerBlock += ` *           type: string\n`;
            swaggerBlock += ` *         description: The ${pathParam === 'user_id' ? 'user ID' : pathParam + ' parameter'}\n`;
        }
        
        // Add request body for POST/PUT methods
        if (route.httpMethod === 'post' || route.httpMethod === 'put') {
            swaggerBlock += ` *     requestBody:\n`;
            swaggerBlock += ` *       required: true\n`;
            swaggerBlock += ` *       content:\n`;
            swaggerBlock += ` *         application/json:\n`;
            swaggerBlock += ` *           schema:\n`;
            
            // Use schema references for specific endpoints
            if (route.fullMethodName.includes('apiLogin')) {
                swaggerBlock += ` *             $ref: '#/components/schemas/LoginRequest'\n`;
            } else if (route.fullMethodName.includes('updateUserAccess')) {
                swaggerBlock += ` *             type: object\n`;
                swaggerBlock += ` *             required:\n`;
                swaggerBlock += ` *               - status\n`;
                swaggerBlock += ` *             properties:\n`;
                swaggerBlock += ` *               status:\n`;
                swaggerBlock += ` *                 type: string\n`;
                swaggerBlock += ` *                 enum: [active, suspend]\n`;
                swaggerBlock += ` *                 description: The new status for the user\n`;
                swaggerBlock += ` *             example:\n`;
                swaggerBlock += ` *               status: active\n`;
            } else {
                swaggerBlock += ` *             type: object\n`;
                swaggerBlock += ` *             properties:\n`;
                swaggerBlock += ` *               data:\n`;
                swaggerBlock += ` *                 type: object\n`;
                swaggerBlock += ` *                 description: Request payload\n`;
            }
        }
        
        // Add responses
        swaggerBlock += ` *     responses:\n`;
        swaggerBlock += ` *       200:\n`;
        
        // Generate specific response descriptions
        if (route.fullMethodName.includes('apiLogin')) {
            swaggerBlock += ` *         description: Login successful\n`;
            swaggerBlock += ` *         content:\n`;
            swaggerBlock += ` *           application/json:\n`;
            swaggerBlock += ` *             schema:\n`;
            swaggerBlock += ` *               $ref: '#/components/schemas/LoginResponse'\n`;
        } else if (route.fullMethodName.includes('apiLogout')) {
            swaggerBlock += ` *         description: Logout successful\n`;
            swaggerBlock += ` *         content:\n`;
            swaggerBlock += ` *           application/json:\n`;
            swaggerBlock += ` *             schema:\n`;
            swaggerBlock += ` *               type: object\n`;
            swaggerBlock += ` *               properties:\n`;
            swaggerBlock += ` *                 message:\n`;
            swaggerBlock += ` *                   type: string\n`;
            swaggerBlock += ` *               example:\n`;
            swaggerBlock += ` *                 message: Logout successful\n`;
        } else if (route.fullMethodName.includes('getUserAccess')) {
            swaggerBlock += ` *         description: User access list retrieved successfully\n`;
            swaggerBlock += ` *         content:\n`;
            swaggerBlock += ` *           application/json:\n`;
            swaggerBlock += ` *             schema:\n`;
            swaggerBlock += ` *               type: object\n`;
            swaggerBlock += ` *               properties:\n`;
            swaggerBlock += ` *                 code:\n`;
            swaggerBlock += ` *                   type: number\n`;
            swaggerBlock += ` *                   example: 200\n`;
            swaggerBlock += ` *                 message:\n`;
            swaggerBlock += ` *                   type: string\n`;
            swaggerBlock += ` *                   example: User access list retrieved successfully\n`;
            swaggerBlock += ` *                 data:\n`;
            swaggerBlock += ` *                   type: object\n`;
            swaggerBlock += ` *                   properties:\n`;
            swaggerBlock += ` *                     active_users:\n`;
            swaggerBlock += ` *                       type: array\n`;
            swaggerBlock += ` *                       items:\n`;
            swaggerBlock += ` *                         type: object\n`;
            swaggerBlock += ` *                         properties:\n`;
            swaggerBlock += ` *                           id:\n`;
            swaggerBlock += ` *                             type: string\n`;
            swaggerBlock += ` *                             example: user123\n`;
            swaggerBlock += ` *                           email:\n`;
            swaggerBlock += ` *                             type: string\n`;
            swaggerBlock += ` *                             example: user@example.com\n`;
            swaggerBlock += ` *                           role:\n`;
            swaggerBlock += ` *                             type: string\n`;
            swaggerBlock += ` *                             example: member\n`;
            swaggerBlock += ` *                           status:\n`;
            swaggerBlock += ` *                             type: string\n`;
            swaggerBlock += ` *                             example: active\n`;
            swaggerBlock += ` *                     request_users:\n`;
            swaggerBlock += ` *                       type: array\n`;
            swaggerBlock += ` *                       items:\n`;
            swaggerBlock += ` *                         type: object\n`;
            swaggerBlock += ` *                     suspended_users:\n`;
            swaggerBlock += ` *                       type: array\n`;
            swaggerBlock += ` *                       items:\n`;
            swaggerBlock += ` *                         type: object\n`;
        } else if (route.fullMethodName.includes('updateUserAccess')) {
            swaggerBlock += ` *         description: User access updated successfully\n`;
            swaggerBlock += ` *         content:\n`;
            swaggerBlock += ` *           application/json:\n`;
            swaggerBlock += ` *             schema:\n`;
            swaggerBlock += ` *               type: object\n`;
            swaggerBlock += ` *               properties:\n`;
            swaggerBlock += ` *                 code:\n`;
            swaggerBlock += ` *                   type: number\n`;
            swaggerBlock += ` *                   example: 200\n`;
            swaggerBlock += ` *                 message:\n`;
            swaggerBlock += ` *                   type: string\n`;
            swaggerBlock += ` *                   example: User access updated successfully\n`;
            swaggerBlock += ` *                 data:\n`;
            swaggerBlock += ` *                   type: object\n`;
            swaggerBlock += ` *                   properties:\n`;
            swaggerBlock += ` *                     id:\n`;
            swaggerBlock += ` *                       type: string\n`;
            swaggerBlock += ` *                       example: user123\n`;
            swaggerBlock += ` *                     status:\n`;
            swaggerBlock += ` *                       type: string\n`;
            swaggerBlock += ` *                       example: active\n`;
        } else {
            swaggerBlock += ` *         description: Successful response\n`;
            swaggerBlock += ` *         content:\n`;
            swaggerBlock += ` *           application/json:\n`;
            swaggerBlock += ` *             schema:\n`;
            swaggerBlock += ` *               type: object\n`;
            swaggerBlock += ` *               properties:\n`;
            swaggerBlock += ` *                 code:\n`;
            swaggerBlock += ` *                   type: integer\n`;
            swaggerBlock += ` *                   example: 200\n`;
            swaggerBlock += ` *                 message:\n`;
            swaggerBlock += ` *                   type: string\n`;
            swaggerBlock += ` *                   example: Success\n`;
            swaggerBlock += ` *                 data:\n`;
            swaggerBlock += ` *                   type: object\n`;
        }
        
        // Add error responses based on endpoint type
        if (route.fullMethodName.includes('updateUserAccess')) {
            swaggerBlock += ` *       400:\n`;
            swaggerBlock += ` *         description: Bad request - Invalid status value\n`;
            swaggerBlock += ` *         content:\n`;
            swaggerBlock += ` *           application/json:\n`;
            swaggerBlock += ` *             schema:\n`;
            swaggerBlock += ` *               $ref: '#/components/schemas/Error'\n`;
        } else {
            swaggerBlock += ` *       400:\n`;
            swaggerBlock += ` *         description: Bad request\n`;
            swaggerBlock += ` *         content:\n`;
            swaggerBlock += ` *           application/json:\n`;
            swaggerBlock += ` *             schema:\n`;
            swaggerBlock += ` *               $ref: '#/components/schemas/Error'\n`;
        }
        
        // Add 401 for authenticated endpoints
        if (!route.fullMethodName.includes('apiLogin') && 
            (route.httpMethod !== 'get' || route.fullMethodName.includes('getUserAccess'))) {
            if (route.fullMethodName.includes('getUserAccess') || route.fullMethodName.includes('updateUserAccess')) {
                swaggerBlock += ` *       401:\n`;
                swaggerBlock += ` *         description: Unauthorized - Admin access required\n`;
            } else {
                swaggerBlock += ` *       401:\n`;
                swaggerBlock += ` *         description: Unauthorized\n`;
            }
            swaggerBlock += ` *         content:\n`;
            swaggerBlock += ` *           application/json:\n`;
            swaggerBlock += ` *             schema:\n`;
            swaggerBlock += ` *               $ref: '#/components/schemas/Error'\n`;
        }
        
        // Add 404 for endpoints with parameters
        if (hasPathParam && (route.fullMethodName.includes('updateUserAccess'))) {
            swaggerBlock += ` *       404:\n`;
            swaggerBlock += ` *         description: User not found\n`;
            swaggerBlock += ` *         content:\n`;
            swaggerBlock += ` *           application/json:\n`;
            swaggerBlock += ` *             schema:\n`;
            swaggerBlock += ` *               $ref: '#/components/schemas/Error'\n`;
        }
        
        swaggerBlock += ` *       500:\n`;
        swaggerBlock += ` *         description: Internal server error\n`;
        swaggerBlock += ` *         content:\n`;
        swaggerBlock += ` *           application/json:\n`;
        swaggerBlock += ` *             schema:\n`;
        swaggerBlock += ` *               $ref: '#/components/schemas/Error'\n`;
        swaggerBlock += ` */\n`;
        
        return swaggerBlock;
    }

    generateRouterLine(route) {
        const controllerName = route.controller;
        const methodName = route.method;
        
        // Add authentication middleware for all endpoints except login
        const middleware = !route.fullMethodName.includes('apiLogin') && 
                          (route.httpMethod !== 'get' || route.fullMethodName.includes('getUserAccess')) 
                          ? 'authenticateToken, ' : '';
        
        return `router.${route.httpMethod}('${route.routerPath}', ${middleware}${controllerName}.${methodName});\n`;
    }

    generateCompleteRoutesFile(routes) {
        const controllers = [...new Set(routes.map(r => r.controller))];
        
        // Generate file header
        let content = `const express = require('express');\n`;
        content += `const router = express.Router();\n`;
        
        // Add controller imports
        for (const controller of controllers) {
            content += `const ${controller} = require('../app/controllers/${controller}');\n`;
        }
        
        content += `const { authenticateToken } = require('../app/middlewares/auth');\n\n`;
        
        // Add swagger components definition
        content += `/**\n`;
        content += ` * @swagger\n`;
        content += ` * components:\n`;
        content += ` *   schemas:\n`;
        content += ` *     Error:\n`;
        content += ` *       type: object\n`;
        content += ` *       properties:\n`;
        content += ` *         code:\n`;
        content += ` *           type: integer\n`;
        content += ` *           example: 400\n`;
        content += ` *         message:\n`;
        content += ` *           type: string\n`;
        content += ` *           example: Error message\n`;
        content += ` *         error:\n`;
        content += ` *           type: string\n`;
        content += ` *           example: Detailed error information\n`;
        content += ` *     LoginRequest:\n`;
        content += ` *       type: object\n`;
        content += ` *       required:\n`;
        content += ` *         - email\n`;
        content += ` *         - password\n`;
        content += ` *       properties:\n`;
        content += ` *         email:\n`;
        content += ` *           type: string\n`;
        content += ` *           example: user@example.com\n`;
        content += ` *         password:\n`;
        content += ` *           type: string\n`;
        content += ` *           example: password123\n`;
        content += ` *     LoginResponse:\n`;
        content += ` *       type: object\n`;
        content += ` *       properties:\n`;
        content += ` *         code:\n`;
        content += ` *           type: integer\n`;
        content += ` *           example: 200\n`;
        content += ` *         message:\n`;
        content += ` *           type: string\n`;
        content += ` *           example: Login successful\n`;
        content += ` *         data:\n`;
        content += ` *           type: object\n`;
        content += ` *           properties:\n`;
        content += ` *             token:\n`;
        content += ` *               type: string\n`;
        content += ` *               example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...\n`;
        content += ` *             user:\n`;
        content += ` *               type: object\n`;
        content += ` *               properties:\n`;
        content += ` *                 id:\n`;
        content += ` *                   type: string\n`;
        content += ` *                   example: user123\n`;
        content += ` *                 email:\n`;
        content += ` *                   type: string\n`;
        content += ` *                   example: user@example.com\n`;
        content += ` *                 role:\n`;
        content += ` *                   type: string\n`;
        content += ` *                   example: member\n`;
        content += ` *                 status:\n`;
        content += ` *                   type: string\n`;
        content += ` *                   example: active\n`;
        content += ` *   securitySchemes:\n`;
        content += ` *     bearerAuth:\n`;
        content += ` *       type: http\n`;
        content += ` *       scheme: bearer\n`;
        content += ` *       bearerFormat: JWT\n`;
        content += ` */\n\n`;
        
        // Generate swagger blocks and routes
        for (const route of routes) {
            content += this.generateSwaggerBlock(route);
            content += this.generateRouterLine(route);
            content += '\n';
        }
        
        // Add module.exports
        content += `module.exports = router;\n`;
        
        return content;
    }

    ensureDirectoryExists(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }
}

module.exports = SwaggerCommand;