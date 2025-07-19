#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class SwaggerCommand {
    constructor() {
        this.modelsPath = path.join(process.cwd(), 'app/models');
        this.controllersPath = path.join(process.cwd(), 'app/controllers');
        this.routesPath = path.join(process.cwd(), 'routes/api.js');
        this.outputPath = path.join(process.cwd(), 'docs/swagger');
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

        console.log(`🔍 Generating Swagger docs for ${controllerName} in routes/api.js...`);
        
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
        
        // Update routes/api.js with controller documentation
        this.addControllerToRoutes(controllerName, controllerRoutes);
    }

    addControllerToRoutes(controllerName, controllerRoutes) {
        // Read current routes file
        const routesContent = fs.readFileSync(this.routesPath, 'utf8');
        
        // Check if controller is already imported
        const controllerImportPattern = new RegExp(`const ${controllerName} = require\\('\\.\\./app/controllers/${controllerName}'\\);`);
        let updatedContent = routesContent;
        
        if (!controllerImportPattern.test(routesContent)) {
            // Add import after the last controller import
            const lastImportMatch = routesContent.match(/const \w+Controller = require\('\.\.\/app\/controllers\/\w+Controller'\);/g);
            if (lastImportMatch) {
                const lastImport = lastImportMatch[lastImportMatch.length - 1];
                const lastImportIndex = routesContent.indexOf(lastImport) + lastImport.length;
                updatedContent = routesContent.slice(0, lastImportIndex) + 
                    `\nconst ${controllerName} = require('../app/controllers/${controllerName}');` +
                    routesContent.slice(lastImportIndex);
            }
        }
        
        // Check for existing controller documentation and remove duplicates
        const existingPattern = new RegExp(`router\\.[a-z]+\\('[^']*',\\s*${controllerName}\\.[a-zA-Z]+\\);`, 'g');
        const existingMatches = updatedContent.match(existingPattern) || [];
        
        if (existingMatches.length > 0) {
            console.log(`⚠️  Found ${existingMatches.length} existing ${controllerName} routes. Removing duplicates...`);
            
            // Remove existing swagger blocks and routes for this controller
            existingMatches.forEach(routeMatch => {
                const routeIndex = updatedContent.indexOf(routeMatch);
                if (routeIndex !== -1) {
                    // Find the swagger block before this route
                    const beforeRoute = updatedContent.slice(0, routeIndex);
                    const lastSwaggerBlockStart = beforeRoute.lastIndexOf('/**');
                    if (lastSwaggerBlockStart !== -1) {
                        const swaggerBlockEnd = updatedContent.indexOf('*/', lastSwaggerBlockStart) + 2;
                        const routeEnd = routeIndex + routeMatch.length;
                        
                        // Remove swagger block and route line
                        updatedContent = updatedContent.slice(0, lastSwaggerBlockStart) + 
                            updatedContent.slice(routeEnd + 1); // +1 for newline
                    }
                }
            });
        }
        
        // Add schema if needed (for TagController)
        if (controllerName === 'TagController') {
            // Always regenerate tag schemas to ensure all are present
            if (updatedContent.includes('# Tag Schemas')) {
                // Remove existing tag schemas
                const tagSchemaStart = updatedContent.indexOf('# Tag Schemas');
                const securitySchemesIndex = updatedContent.indexOf('  securitySchemes:');
                if (tagSchemaStart !== -1 && securitySchemesIndex !== -1) {
                    updatedContent = updatedContent.slice(0, tagSchemaStart) + 
                        updatedContent.slice(securitySchemesIndex);
                }
            }
            
            const tagSchemas = this.generateTagSchemas();
            // Add after existing schemas, before securitySchemes
            const securitySchemesIndex = updatedContent.indexOf('  securitySchemes:');
            if (securitySchemesIndex !== -1) {
                updatedContent = updatedContent.slice(0, securitySchemesIndex) + 
                    tagSchemas + '\n     ' +
                    updatedContent.slice(securitySchemesIndex);
            }
        }
        
        // Generate swagger documentation for each route
        let routeDocumentation = '';
        controllerRoutes.forEach(route => {
            routeDocumentation += this.generateFormattedSwaggerBlock(route);
            routeDocumentation += `router.${route.httpMethod}('${route.routerPath}', ${controllerName}.${route.method});\n\n`;
        });
        
        // Add the documentation before module.exports
        const moduleExportsIndex = updatedContent.indexOf('module.exports = router;');
        if (moduleExportsIndex !== -1) {
            updatedContent = updatedContent.slice(0, moduleExportsIndex) + 
                routeDocumentation +
                updatedContent.slice(moduleExportsIndex);
        }
        
        // Write updated content
        fs.writeFileSync(this.routesPath, updatedContent);
        
        console.log(`✅ Added ${controllerRoutes.length} ${controllerName} endpoints to routes/api.js`);
    }

    generateControllerSchemas(controllerName) {
        const tag = controllerName.replace('Controller', '');
        let schemas = '';
        
        // Add controller-specific schemas based on controller type
        if (controllerName === 'TagController') {
            schemas += `/**\n * @swagger\n * components:\n *   schemas:\n`;
            schemas += ` *     Tag:\n`;
            schemas += ` *       type: object\n`;
            schemas += ` *       properties:\n`;
            schemas += ` *         id:\n`;
            schemas += ` *           type: string\n`;
            schemas += ` *           example: tag123\n`;
            schemas += ` *         name:\n`;
            schemas += ` *           type: string\n`;
            schemas += ` *           example: Rock\n`;
            schemas += ` *         description:\n`;
            schemas += ` *           type: string\n`;
            schemas += ` *           example: Rock music genre\n`;
            schemas += ` *         createdAt:\n`;
            schemas += ` *           type: string\n`;
            schemas += ` *           format: date-time\n`;
            schemas += ` *         updatedAt:\n`;
            schemas += ` *           type: string\n`;
            schemas += ` *           format: date-time\n`;
            schemas += ` */\n\n`;
        } else if (controllerName === 'NoteController') {
            schemas += `/**\n * @swagger\n * components:\n *   schemas:\n`;
            schemas += ` *     Note:\n`;
            schemas += ` *       type: object\n`;
            schemas += ` *       properties:\n`;
            schemas += ` *         id:\n`;
            schemas += ` *           type: string\n`;
            schemas += ` *           example: note123\n`;
            schemas += ` *         notes:\n`;
            schemas += ` *           type: string\n`;
            schemas += ` *           example: Great song for parties\n`;
            schemas += ` *         user_id:\n`;
            schemas += ` *           type: string\n`;
            schemas += ` *           example: user123\n`;
            schemas += ` *         song_id:\n`;
            schemas += ` *           type: string\n`;
            schemas += ` *           example: song123\n`;
            schemas += ` *         Song:\n`;
            schemas += ` *           $ref: '#/components/schemas/Song'\n`;
            schemas += ` *         createdAt:\n`;
            schemas += ` *           type: string\n`;
            schemas += ` *           format: date-time\n`;
            schemas += ` *         updatedAt:\n`;
            schemas += ` *           type: string\n`;
            schemas += ` *           format: date-time\n`;
            schemas += ` *     Song:\n`;
            schemas += ` *       type: object\n`;
            schemas += ` *       properties:\n`;
            schemas += ` *         id:\n`;
            schemas += ` *           type: string\n`;
            schemas += ` *         title:\n`;
            schemas += ` *           type: string\n`;
            schemas += ` *         artist:\n`;
            schemas += ` *           type: string\n`;
            schemas += ` */\n\n`;
        }
        
        return schemas;
    }

    generateTagSchemas() {
        return `# Tag Schemas
 *     Tag:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: tag123
 *         name:
 *           type: string
 *           example: Rock
 *         description:
 *           type: string
 *           example: Rock music genre
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     CreateTagRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: Rock
 *           description: The name of the tag
 *         description:
 *           type: string
 *           example: Rock music genre
 *           description: Optional description of the tag
 *     
 *     UpdateTagRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: Rock
 *           description: The name of the tag
 *         description:
 *           type: string
 *           example: Rock music genre
 *           description: Optional description of the tag
 *     
 *     TagsResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Get All Tags
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Tag'
 *     
 *     TagResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Tag created successfully
 *         data:
 *           $ref: '#/components/schemas/Tag'
 *     `;
    }

    generateFormattedSwaggerBlock(route) {
        const tag = route.controller.replace('Controller', '');
        const hasPathParam = route.routerPath.includes(':');
        const pathParam = hasPathParam ? route.routerPath.match(/:(\w+)/)[1] : null;
        
        // Convert :param to {param} format for swagger
        const swaggerPath = route.path.replace(/:(\w+)/g, '{$1}');
        
        let block = `/**\n * @swagger\n * ${swaggerPath}:\n *   ${route.httpMethod}:\n`;
        
        // Generate method-specific summaries and descriptions
        const { summary, description } = this.generateMethodSummaryAndDescription(route);
        block += ` *     summary: ${summary}\n`;
        block += ` *     description: ${description}\n`;
        
        block += ` *     tags: [${tag}]\n`;
        
        // Add parameters if needed
        if (hasPathParam) {
            block += ` *     parameters:\n`;
            block += ` *       - in: path\n`;
            block += ` *         name: ${pathParam}\n`;
            block += ` *         required: true\n`;
            block += ` *         schema:\n`;
            block += ` *           type: string\n`;
            block += ` *         description: The ${pathParam === 'user_id' ? 'user ID' : pathParam + ' parameter'}\n`;
        }
        
        // Add request body for POST/PUT methods
        if (route.httpMethod === 'post' || route.httpMethod === 'put') {
            block += ` *     requestBody:\n`;
            block += ` *       required: true\n`;
            block += ` *       content:\n`;
            block += ` *         application/json:\n`;
            block += ` *           schema:\n`;
            
            // Use specific schemas for tag operations
            if (route.controller === 'TagController') {
                if (route.httpMethod === 'post') {
                    block += ` *             $ref: '#/components/schemas/CreateTagRequest'\n`;
                } else if (route.httpMethod === 'put') {
                    block += ` *             $ref: '#/components/schemas/UpdateTagRequest'\n`;
                }
            } else {
                // Generic request body for other controllers
                block += ` *             type: object\n`;
                block += ` *             properties:\n`;
                block += ` *               data:\n`;
                block += ` *                 type: object\n`;
                block += ` *                 description: Request payload\n`;
            }
        }
        
        // Add responses
        block += ` *     responses:\n`;
        block += ` *       200:\n`;
        
        if (route.controller === 'TagController') {
            block += ` *         description: Successful response\n`;
            block += ` *         content:\n`;
            block += ` *           application/json:\n`;
            block += ` *             schema:\n`;
            
            // Use appropriate response schema based on method
            if (route.method === 'GetTags') {
                block += ` *               $ref: '#/components/schemas/TagsResponse'\n`;
            } else if (route.method === 'GetTagById' || route.method === 'CreateTag' || route.method === 'UpdateTag') {
                block += ` *               $ref: '#/components/schemas/TagResponse'\n`;
            } else if (route.method === 'DeleteTag') {
                block += ` *               type: object\n`;
                block += ` *               properties:\n`;
                block += ` *                 message:\n`;
                block += ` *                   type: string\n`;
                block += ` *                   example: Tag deleted successfully\n`;
            } else {
                block += ` *               $ref: '#/components/schemas/TagsResponse'\n`;
            }
        } else {
            block += ` *         description: Successful response\n`;
            block += ` *         content:\n`;
            block += ` *           application/json:\n`;
            block += ` *             schema:\n`;
            block += ` *               $ref: '#/components/schemas/BaseResponseWithData'\n`;
        }
        
        // Add error responses
        block += ` *       400:\n`;
        block += ` *         description: Bad request\n`;
        block += ` *         content:\n`;
        block += ` *           application/json:\n`;
        block += ` *             schema:\n`;
        block += ` *               $ref: '#/components/schemas/BadRequestError'\n`;
        block += ` *       500:\n`;
        block += ` *         description: Internal server error\n`;
        block += ` *         content:\n`;
        block += ` *           application/json:\n`;
        block += ` *             schema:\n`;
        block += ` *               $ref: '#/components/schemas/InternalServerError'\n`;
        block += ` */\n`;
        
        return block;
    }

    generateMethodSummaryAndDescription(route) {
        const methodName = route.method;
        const httpMethod = route.httpMethod.toUpperCase();
        
        // Method-specific summaries based on common patterns
        const summaryMap = {
            'GetTags': { summary: 'Get all tags', description: 'Retrieve all available tags' },
            'GetTagById': { summary: 'Get tag by ID', description: 'Retrieve a specific tag by its ID' },
            'CreateTag': { summary: 'Create new tag', description: 'Create a new tag with name and description' },
            'UpdateTag': { summary: 'Update tag', description: 'Update an existing tag by ID' },
            'DeleteTag': { summary: 'Delete tag', description: 'Delete a tag by ID' },
            'GetNoteByUserId': { summary: 'Get notes by user ID', description: 'Retrieve all notes for a specific user' },
            'getUserAccess': { summary: 'Get user access list', description: 'Retrieve user access list for admin management' },
            'updateUserAccess': { summary: 'Update user access', description: 'Update user access status (active/suspend)' },
            'apiLogin': { summary: 'User login', description: 'Authenticate user with email and password' },
            'apiLogout': { summary: 'User logout', description: 'Logout authenticated user' }
        };
        
        if (summaryMap[methodName]) {
            return summaryMap[methodName];
        }
        
        // Fallback to generic summaries based on HTTP method
        const fallbackMap = {
            'GET': { summary: `${httpMethod} ${route.routerPath}`, description: `Retrieve data from ${route.routerPath}` },
            'POST': { summary: `${httpMethod} ${route.routerPath}`, description: `Create new resource at ${route.routerPath}` },
            'PUT': { summary: `${httpMethod} ${route.routerPath}`, description: `Update resource at ${route.routerPath}` },
            'DELETE': { summary: `${httpMethod} ${route.routerPath}`, description: `Delete resource at ${route.routerPath}` }
        };
        
        return fallbackMap[httpMethod] || { summary: `${httpMethod} ${route.routerPath}`, description: `Auto-generated endpoint for ${route.fullMethodName}` };
    }

    updateMainRoutes(controllerRoutes) {
        console.log('🔄 Updating main routes file with controller routes...');
        
        const routes = this.scanRoutes();
        const existingRoutes = this.scanControllers();
        
        // Generate all routes including the new controller routes
        const allRoutes = [];
        
        // Add existing routes from other controllers
        Object.keys(existingRoutes).forEach(controllerName => {
            if (controllerName !== controllerRoutes[0].controller) {
                Object.keys(existingRoutes[controllerName].methods).forEach(methodName => {
                    const method = existingRoutes[controllerName].methods[methodName];
                    const routePath = method.endpointPath || this.generateRoutePath({
                        controller: controllerName,
                        method: methodName,
                        httpMethod: method.httpMethod
                    });
                    
                    allRoutes.push({
                        controller: controllerName,
                        method: methodName,
                        httpMethod: method.httpMethod,
                        path: routePath,
                        routerPath: routePath.replace('/api', ''),
                        fullMethodName: `${controllerName}.${methodName}`
                    });
                });
            }
        });
        
        // Add the new controller routes
        allRoutes.push(...controllerRoutes);
        
        // Generate and write the complete routes file
        const newRoutesContent = this.generateCompleteRoutesFile(allRoutes);
        fs.writeFileSync(this.routesPath, newRoutesContent);
        
        console.log('✅ Main routes file updated successfully');
    }

    // Methods moved from SwaggerCommand
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

    scanRoutes() {
        // Simplified route scanning
        return [];
    }

    getActiveControllerMethods(controllers) {
        const activeControllerMethods = [];
        
        for (const [controllerName, controller] of Object.entries(controllers)) {
            for (const [methodName, method] of Object.entries(controller.methods)) {
                activeControllerMethods.push({
                    controller: controllerName,
                    method: methodName,
                    httpMethod: method.httpMethod,
                    fullMethodName: `${controllerName}.${methodName}`
                });
            }
        }
        
        return activeControllerMethods;
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