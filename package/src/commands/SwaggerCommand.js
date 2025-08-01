#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class SwaggerCommand {
  constructor() {
    this.modelsPath = path.join(process.cwd(), "app/models");
    this.controllersPath = path.join(process.cwd(), "app/controllers");
    this.routesPath = path.join(process.cwd(), "routes/api.js");
    this.outputPath = path.join(process.cwd(), "swagger/swagger.json");
    this.args = process.argv.slice(2);
    this.packageSchemasPath = path.join(__dirname, "../schemas");
    this.userSchemasPath = path.join(process.cwd(), "schemas");
    this.loadedSchemas = null;
  }

  async loadSchemas() {
    if (this.loadedSchemas) {
      return this.loadedSchemas;
    }

    const schemas = {
      errors: {},
      responses: {},
      requests: {},
      common: {},
      models: {},
    };

    // Load package schemas first (defaults)
    try {
      if (fs.existsSync(this.packageSchemasPath)) {
        // Load package error schemas
        const packageErrorsPath = path.join(this.packageSchemasPath, "errors");
        if (fs.existsSync(packageErrorsPath)) {
          const errorFiles = fs
            .readdirSync(packageErrorsPath)
            .filter((f) => f.endsWith(".js") && f !== "index.js");
          for (const file of errorFiles) {
            const schemaName = path.basename(file, ".js");
            try {
              const module = await import(
                `file://${path.join(packageErrorsPath, file)}`
              );
              schemas.errors[schemaName] = module.default;
            } catch (error) {
              console.warn(
                `Warning: Could not load package error schema ${schemaName}: ${error.message}`
              );
            }
          }
        }

        // Load package common schemas
        const packageCommonPath = path.join(this.packageSchemasPath, "common");
        if (fs.existsSync(packageCommonPath)) {
          const commonFiles = fs
            .readdirSync(packageCommonPath)
            .filter((f) => f.endsWith(".js") && f !== "index.js");
          for (const file of commonFiles) {
            const schemaName = path.basename(file, ".js");
            try {
              const module = await import(
                `file://${path.join(packageCommonPath, file)}`
              );
              schemas.common[schemaName] = module.default;
            } catch (error) {
              console.warn(
                `Warning: Could not load package common schema ${schemaName}: ${error.message}`
              );
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not load package schemas: ${error.message}`);
    }

    // Load user schemas (overrides)
    try {
      if (fs.existsSync(this.userSchemasPath)) {
        // Load user error schemas (override package defaults)
        const userErrorsPath = path.join(this.userSchemasPath, "errors");
        if (fs.existsSync(userErrorsPath)) {
          const errorFiles = fs
            .readdirSync(userErrorsPath)
            .filter((f) => f.endsWith(".js") && f !== "index.js");
          for (const file of errorFiles) {
            const schemaName = path.basename(file, ".js");
            try {
              const module = await import(
                `file://${path.join(userErrorsPath, file)}`
              );
              schemas.errors[schemaName] = module.default;
            } catch (error) {
              console.warn(
                `Warning: Could not load user error schema ${schemaName}: ${error.message}`
              );
            }
          }
        }

        // Load user response schemas
        const userResponsesPath = path.join(this.userSchemasPath, "responses");
        if (fs.existsSync(userResponsesPath)) {
          const responseFiles = fs
            .readdirSync(userResponsesPath)
            .filter((f) => f.endsWith(".js") && f !== "index.js");
          for (const file of responseFiles) {
            const schemaName = path.basename(file, ".js");
            try {
              const module = await import(
                `file://${path.join(userResponsesPath, file)}`
              );
              schemas.responses[schemaName] = module.default;
            } catch (error) {
              console.warn(
                `Warning: Could not load user response schema ${schemaName}: ${error.message}`
              );
            }
          }
        }

        // Load user request schemas
        const userRequestsPath = path.join(this.userSchemasPath, "requests");
        if (fs.existsSync(userRequestsPath)) {
          const requestFiles = fs
            .readdirSync(userRequestsPath)
            .filter((f) => f.endsWith(".js") && f !== "index.js");
          for (const file of requestFiles) {
            const schemaName = path.basename(file, ".js");
            try {
              const module = await import(
                `file://${path.join(userRequestsPath, file)}`
              );
              schemas.requests[schemaName] = module.default;
            } catch (error) {
              console.warn(
                `Warning: Could not load user request schema ${schemaName}: ${error.message}`
              );
            }
          }
        }

        // Load user model schemas (new Go-style models)
        const userModelsPath = path.join(this.userSchemasPath, "models");
        if (fs.existsSync(userModelsPath)) {
          const modelFiles = fs
            .readdirSync(userModelsPath)
            .filter((f) => f.endsWith(".js") && f !== "index.js");
          for (const file of modelFiles) {
            const schemaName = path.basename(file, ".js");
            try {
              // Store models in a separate namespace
              if (!schemas.models) schemas.models = {};
              const module = await import(
                `file://${path.join(userModelsPath, file)}`
              );
              schemas.models[schemaName] = module.default;
            } catch (error) {
              console.warn(
                `Warning: Could not load user model schema ${schemaName}: ${error.message}`
              );
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not load user schemas: ${error.message}`);
    }

    this.loadedSchemas = schemas;
    return schemas;
  }

  async getSchema(schemaName) {
    const schemas = await this.loadSchemas();

    // Try to find in responses first
    if (schemas.responses[schemaName]) {
      return schemas.responses[schemaName];
    }

    // Then try errors
    if (schemas.errors[schemaName]) {
      return schemas.errors[schemaName];
    }

    // Then try requests
    if (schemas.requests[schemaName]) {
      return schemas.requests[schemaName];
    }

    // Finally try common
    if (schemas.common[schemaName]) {
      return schemas.common[schemaName];
    }

    // Try models (Go-style)
    if (schemas.models[schemaName]) {
      return schemas.models[schemaName];
    }

    // Try model.* references
    if (schemaName.startsWith("model.")) {
      const modelName = schemaName.substring(6); // Remove 'model.' prefix
      if (schemas.models[modelName]) {
        return schemas.models[modelName];
      }
    }

    return null;
  }

  parseSchemaPath(schema) {
    // Handle different schema formats
    if (typeof schema === "string") {
      // Simple schema name like "LoginRequest"
      return { schemaName: schema };
    }

    if (schema && schema.type) {
      // Object schema with type property
      return { schemaName: schema.type };
    }

    // Default fallback
    return { schemaName: "object" };
  }

  convertSchemasForSwagger(loadedSchemas) {
    const flatSchemas = {};

    // Flatten error schemas
    if (loadedSchemas && loadedSchemas.errors) {
      Object.keys(loadedSchemas.errors).forEach((errorName) => {
        flatSchemas[errorName] = loadedSchemas.errors[errorName];
      });
    }

    // Flatten common schemas
    if (loadedSchemas && loadedSchemas.common) {
      Object.keys(loadedSchemas.common).forEach((commonName) => {
        flatSchemas[commonName] = loadedSchemas.common[commonName];
      });
    }

    // Flatten model schemas
    if (loadedSchemas && loadedSchemas.models) {
      Object.keys(loadedSchemas.models).forEach((modelName) => {
        flatSchemas[modelName] = loadedSchemas.models[modelName];
      });
    }

    // Flatten request schemas
    if (loadedSchemas && loadedSchemas.requests) {
      Object.keys(loadedSchemas.requests).forEach((requestName) => {
        flatSchemas[requestName] = loadedSchemas.requests[requestName];
      });
    }

    // Flatten response schemas
    if (loadedSchemas && loadedSchemas.responses) {
      Object.keys(loadedSchemas.responses).forEach((responseName) => {
        flatSchemas[responseName] = loadedSchemas.responses[responseName];
      });
    }

    return flatSchemas;
  }

  async execute() {
    if (this.args.length === 0) {
      this.showUsage();
      return;
    }

    const command = this.args[0];
    const controllerName = this.args[1];

    switch (command) {
      case "generate":
        if (controllerName === "all") {
          await this.generateAll();
        } else {
          await this.generateByController(controllerName);
        }
        break;
      case "list":
        this.listControllers();
        break;
      case "help":
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
      console.log("📋 Available Controllers:");
    }

    const controllers = this.scanControllers();

    Object.keys(controllers).forEach((controllerName) => {
      const controller = controllers[controllerName];
      const methodCount = Object.keys(controller.methods).length;
      console.log(`  • ${controllerName} (${methodCount} methods)`);

      Object.keys(controller.methods).forEach((methodName) => {
        const method = controller.methods[methodName];
        console.log(`    - ${method.httpMethod.toUpperCase()} ${methodName}()`);
      });
    });
  }

  async generateAll() {
    console.log("🚀 Generating routes and swagger for all controllers...");

    // Scan all controllers
    const allControllers = this.scanControllers();

    // Generate swagger and routes for the first controller to trigger full generation
    const firstController = Object.keys(allControllers)[0];
    if (firstController) {
      await this.generateByController(firstController);
    }
  }

  async generateByController(controllerName) {
    if (!controllerName) {
      console.error("❌ Controller name is required");
      this.showUsage();
      return;
    }

    console.log(`🔍 Generating Swagger docs for ${controllerName}...`);

    const controllers = this.scanControllers();

    if (!controllers[controllerName]) {
      console.error(`❌ Controller '${controllerName}' not found`);
      console.log("💡 Available controllers:");
      Object.keys(controllers).forEach((name) => {
        console.log(`  • ${name}`);
      });
      return;
    }

    const controller = controllers[controllerName];

    // Generate routes for this specific controller
    const controllerRoutes = [];

    Object.keys(controller.methods).forEach((methodName) => {
      const method = controller.methods[methodName];

      // Use @Router annotation if available
      let routePath = method.endpointPath;
      if (method.annotations && method.annotations.Router) {
        const routerAnnotation = method.annotations.Router;
        if (typeof routerAnnotation === "object" && routerAnnotation.path) {
          routePath = routerAnnotation.path;
        } else if (typeof routerAnnotation === "string") {
          // Legacy string format support
          const routerMatch = routerAnnotation.match(/([^[\s]+)/);
          if (routerMatch) {
            routePath = routerMatch[1];
          }
        }
      }

      // Fallback to generated path
      if (!routePath) {
        routePath = this.generateRoutePath({
          controller: controllerName,
          method: methodName,
          httpMethod: method.httpMethod,
        });
      }

      controllerRoutes.push({
        controller: controllerName,
        method: methodName,
        httpMethod: method.httpMethod,
        endpointPath: method.endpointPath,
        path: routePath,
        routerPath: routePath.replace("/api", ""),
        fullMethodName: `${controllerName}.${methodName}`,
        annotations: method.annotations,
      });
    });

    console.log(
      `📝 Found ${controllerRoutes.length} methods in ${controllerName}`
    );

    // Update swagger.json with controller documentation
    await this.addControllerToSwagger(controllerName, controllerRoutes);

    // Update routes/api.js with simple route definitions
    this.updateRoutesFile(controllerName, controllerRoutes);
  }

  async addControllerToSwagger(controllerName, controllerRoutes) {
    // Always create fresh swagger.json - scan all controllers and regenerate completely
    const allControllers = this.scanControllers();

    // Create fresh swagger spec
    const swaggerSpec = {
      openapi: "3.0.0",
      info: {
        title: "SongBanks API",
        description:
          "Auto-generated API documentation using Swagpress framework",
        version: "1.0.0",
      },
      servers: [
        {
          url: "http://localhost:3000/api",
          description: "Development server",
        },
        {
          url: "https://songbanks-v1-1.vercel.app/api",
          description: "Production server",
        },
      ],
      components: {
        schemas: {},
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      paths: {},
    };

    // Add schemas from the new schema loader system
    const loadedSchemas = await this.loadSchemas();
    swaggerSpec.components.schemas = {
      ...swaggerSpec.components.schemas,
      ...this.getBaseSchemas(),
      // Add schemas loaded from files
      ...this.convertSchemasForSwagger(loadedSchemas),
    };

    // Generate routes for ALL controllers
    Object.keys(allControllers).forEach((currentControllerName) => {
      const controller = allControllers[currentControllerName];

      // Add controller-specific schemas
      this.addControllerSchemas(swaggerSpec, currentControllerName);

      // Generate routes for this controller
      Object.keys(controller.methods).forEach((methodName) => {
        const method = controller.methods[methodName];

        // Use @Router annotation if available
        let routePath = method.endpointPath;
        if (method.annotations && method.annotations.Router) {
          const routerAnnotation = method.annotations.Router;
          if (typeof routerAnnotation === "object" && routerAnnotation.path) {
            routePath = routerAnnotation.path;
          } else if (typeof routerAnnotation === "string") {
            // Legacy string format support
            const routerMatch = routerAnnotation.match(/([^[\s]+)/);
            if (routerMatch) {
              routePath = routerMatch[1];
            }
          }
        }

        // Fallback to generated path
        if (!routePath) {
          routePath = this.generateRoutePath({
            controller: currentControllerName,
            method: methodName,
            httpMethod: method.httpMethod,
          });
        }

        const route = {
          controller: currentControllerName,
          method: methodName,
          httpMethod: method.httpMethod,
          endpointPath: method.endpointPath,
          path: routePath,
          routerPath: routePath.replace("/api", ""),
          fullMethodName: `${currentControllerName}.${methodName}`,
          annotations: method.annotations,
        };

        const swaggerPath = this.routerPathToSwaggerPath(route.routerPath);

        if (!swaggerSpec.paths[swaggerPath]) {
          swaggerSpec.paths[swaggerPath] = {};
        }

        swaggerSpec.paths[swaggerPath][route.httpMethod] =
          this.generateSwaggerOperation(route, currentControllerName);
      });
    });

    // Write completely fresh swagger.json
    fs.writeFileSync(this.outputPath, JSON.stringify(swaggerSpec, null, 2));

    const totalEndpoints = Object.keys(swaggerSpec.paths).reduce(
      (total, path) => {
        return total + Object.keys(swaggerSpec.paths[path]).length;
      },
      0
    );

    console.log(
      `✅ Generated fresh swagger.json with ${totalEndpoints} total endpoints from ${Object.keys(allControllers).length} controllers`
    );
  }

  updateRoutesFile(controllerName, controllerRoutes) {
    // For complete rewrite, regenerate the entire routes file when any controller is processed
    this.generateCompleteRoutesFile();
  }

  generateCompleteRoutesFile() {
    console.log("🔄 Regenerating complete routes file...");

    // Scan all controllers to get complete picture
    const allControllers = this.scanControllers();

    // Organize controllers by groups and resources
    const groupedControllers = {};
    const resourceControllers = {};
    const ungroupedControllers = {};

    Object.keys(allControllers).forEach((controllerName) => {
      const controller = allControllers[controllerName];

      // Check if controller has group or resource annotations
      let hasGroup = false;
      let hasResource = false;
      let groupName = null;
      let resourceName = null;

      Object.keys(controller.methods).forEach((methodName) => {
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
          controller,
        });
      } else if (hasGroup) {
        if (!groupedControllers[groupName]) {
          groupedControllers[groupName] = [];
        }
        groupedControllers[groupName].push({
          controllerName,
          controller,
        });
      } else {
        ungroupedControllers[controllerName] = controller;
      }
    });

    // Generate routes file content
    let routesContent = this.generateRoutesFileHeader(
      Object.keys(allControllers)
    );

    // Add resource routes
    Object.keys(resourceControllers).forEach((resourceName) => {
      routesContent += this.generateResourceRoutes(
        resourceName,
        resourceControllers[resourceName]
      );
    });

    // Add grouped routes
    Object.keys(groupedControllers).forEach((groupName) => {
      routesContent += this.generateGroupRoutes(
        groupName,
        groupedControllers[groupName]
      );
    });

    // Add ungrouped routes
    Object.keys(ungroupedControllers).forEach((controllerName) => {
      routesContent += this.generateControllerRoutes(
        controllerName,
        ungroupedControllers[controllerName]
      );
    });

    // Add footer
    routesContent += "\nexport default router;\n";

    // Write the complete routes file
    fs.writeFileSync(this.routesPath, routesContent);

    console.log("✅ Generated complete routes file with groups and resources");
  }

  generateRoutesFileHeader(controllerNames) {
    let header = `import express from 'express';
const router = express.Router();
`;

    // Add controller imports
    controllerNames.forEach((controllerName) => {
      header += `import ${controllerName} from '../app/controllers/${controllerName}.js';\n`;
    });

    // Add middleware imports
    header += `import { authenticateToken } from '../app/middlewares/auth.js';\n\n`;

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
          index: { method: "get", path: resourcePath },
          show: { method: "get", path: `${resourcePath}/:id` },
          create: { method: "post", path: resourcePath },
          update: { method: "put", path: `${resourcePath}/:id` },
          destroy: { method: "delete", path: `${resourcePath}/:id` },
        };

        crudMethods.forEach((crudMethod) => {
          if (routeMap[crudMethod]) {
            const { method: httpMethod, path } = routeMap[crudMethod];
            const methodName = this.findMethodForCrudAction(
              controller.methods,
              crudMethod
            );
            if (methodName) {
              routesContent += `router.${httpMethod}('${path}', ${controllerName}.${methodName});\n`;
            }
          }
        });

        routesContent += "\n";
      } else {
        // Generate individual routes
        Object.keys(controller.methods).forEach((methodName) => {
          const method = controller.methods[methodName];
          const route = this.generateRouteFromMethod(
            controllerName,
            methodName,
            method
          );
          if (route) {
            routesContent += `${route}\n`;
          }
        });
        routesContent += "\n";
      }
    });

    return routesContent;
  }

  generateGroupRoutes(groupName, groupControllers) {
    let routesContent = `// ${groupName} Group Routes\n`;

    groupControllers.forEach(({ controllerName, controller }) => {
      Object.keys(controller.methods).forEach((methodName) => {
        const method = controller.methods[methodName];
        const route = this.generateRouteFromMethod(
          controllerName,
          methodName,
          method
        );
        if (route) {
          routesContent += `${route}\n`;
        }
      });
    });

    routesContent += "\n";
    return routesContent;
  }

  generateControllerRoutes(controllerName, controller) {
    let routesContent = `// ${controllerName} Routes\n`;

    Object.keys(controller.methods).forEach((methodName) => {
      const method = controller.methods[methodName];
      const route = this.generateRouteFromMethod(
        controllerName,
        methodName,
        method
      );
      if (route) {
        routesContent += `${route}\n`;
      }
    });

    routesContent += "\n";
    return routesContent;
  }

  generateRouteFromMethod(controllerName, methodName, method) {
    let httpMethod = method.httpMethod || this.inferHttpMethod(methodName);

    // Use explicit endpoint path if available, otherwise generate
    let routePath;

    // Check for @Router annotation first
    if (method.annotations && method.annotations.Router) {
      const routerAnnotation = method.annotations.Router;
      if (typeof routerAnnotation === "object" && routerAnnotation.path) {
        // Use HTTP method from Router annotation if available
        if (routerAnnotation.method) {
          httpMethod = routerAnnotation.method;
        }
        // Convert {param} to :param for Express.js
        routePath = routerAnnotation.path
          .replace("/api", "")
          .replace(/\{(\w+)\}/g, ":$1");
      } else if (typeof routerAnnotation === "string") {
        // Legacy string format support
        const routerMatch = routerAnnotation.match(/([^[\s]+)/);
        if (routerMatch) {
          // Convert {param} to :param for Express.js
          routePath = routerMatch[1]
            .replace("/api", "")
            .replace(/\{(\w+)\}/g, ":$1");
        }
      }
    }
    // Fallback to endpointPath annotation
    else if (method.annotations && method.annotations.endpointPath) {
      routePath = method.annotations.endpointPath.replace("/api", "");
    }
    // Generate path as last resort
    else {
      routePath = this.generateRoutePath({
        controller: controllerName,
        method: methodName,
        httpMethod: httpMethod,
      }).replace("/api", "");
    }

    // Add authentication middleware if @auth annotation is present
    const middlewares = [];
    if (method.annotations && method.annotations.auth) {
      middlewares.push("authenticateToken");
    }

    const middlewareStr =
      middlewares.length > 0 ? middlewares.join(", ") + ", " : "";
    return `router.${httpMethod}('${routePath}', ${middlewareStr}${controllerName}.${methodName});`;
  }

  findMethodForCrudAction(methods, crudAction) {
    // Find the actual method name that corresponds to a CRUD action
    const searchTerms = {
      index: ["index", "getall", "list"],
      show: ["show", "getbyid", "get"],
      create: ["create", "post", "add"],
      update: ["update", "put", "edit"],
      destroy: ["destroy", "delete", "remove"],
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
      index: "index",
      show: "show",
      create: "create",
      update: "update",
      destroy: "destroy",
    };

    const foundMethods = [];
    Object.keys(methods).forEach((methodName) => {
      const lowerMethod = methodName.toLowerCase();
      Object.keys(crudMapping).forEach((crudAction) => {
        if (
          lowerMethod.includes(crudAction) ||
          lowerMethod.includes(crudMapping[crudAction])
        ) {
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
    return routerPath.replace(/:(\w+)/g, "{$1}");
  }

  generateSwaggerOperation(route, controllerName) {
    const tag = controllerName.replace("Controller", "");
    const hasPathParam = route.routerPath.includes(":");
    const pathParam = hasPathParam ? route.routerPath.match(/:(\w+)/)[1] : null;

    // Use annotations from the JSDoc if available
    const annotations = route.annotations || {};

    // Generate method-specific summaries and descriptions
    const { summary, description } =
      this.generateMethodSummaryAndDescription(route);

    const operation = {
      summary: annotations.Summary || annotations.summary || summary,
      description: annotations.Description || description,
      tags: Array.isArray(annotations.Tags)
        ? annotations.Tags
        : annotations.Tags
          ? [annotations.Tags]
          : [tag],
    };

    // Handle parameters from Go-style @Param annotations
    const parameters = [];

    // Add parsed @Param annotations (exclude body parameters)
    if (annotations.Param && annotations.Param.length > 0) {
      annotations.Param.forEach((param) => {
        // Skip body parameters as they should be in requestBody, not parameters array
        if (param.in === "body") {
          return;
        }

        const paramObj = {
          in: param.in,
          name: param.name,
          required: param.required,
          schema: { type: param.type },
          description: param.description || param.name,
        };

        // Handle enum values
        if (param.enum) {
          paramObj.schema.enum = param.enum;
        }

        // Handle model references for header parameters
        if (param.in === "header" && param.model) {
          // For header models like AuthorizedCommonHeaders, expand to individual parameters
          const headerModel = this.getSchema(param.model);
          if (headerModel && headerModel.properties) {
            Object.keys(headerModel.properties).forEach((headerName) => {
              const headerProp = headerModel.properties[headerName];
              parameters.push({
                in: "header",
                name: headerName,
                required:
                  headerModel.required &&
                  headerModel.required.includes(headerName),
                schema: {
                  type: headerProp.type,
                  enum: headerProp.enum,
                },
                description: headerProp.description || headerName,
                example: headerProp.example,
              });
            });
          }
        } else {
          parameters.push(paramObj);
        }
      });
    }

    // Legacy parameter handling for path params if no @Param annotations
    if (
      hasPathParam &&
      parameters.filter((p) => p.in === "path").length === 0
    ) {
      parameters.push({
        in: "path",
        name: pathParam,
        required: true,
        schema: {
          type: "string",
        },
        description:
          pathParam === "user_id"
            ? "The user ID"
            : `The ${pathParam} parameter`,
      });
    }

    if (parameters.length > 0) {
      operation.parameters = parameters;
    }

    // Add request body for POST/PUT methods or from @Param body annotations or @Body annotation
    const bodyParams = annotations.Param
      ? annotations.Param.filter((p) => p.in === "body")
      : [];
    const hasBodyParam = bodyParams.length > 0;
    const hasBodyAnnotation = annotations.Body && annotations.Body.schema;
    const hasAnyParams = annotations.Param && annotations.Param.length > 0;

    // Only add request body if:
    // 1. There are explicit body parameters, OR
    // 2. There's a @Body annotation
    // Note: Removed automatic body generation for POST/PUT to avoid unnecessary request bodies
    if (hasBodyParam || hasBodyAnnotation) {
      let requestSchema;

      // Check if there's a @Body annotation first
      if (hasBodyAnnotation) {
        const bodyAnnotation = annotations.Body;
        const schemaPath = this.parseSchemaPath(bodyAnnotation.schema);
        requestSchema = {
          $ref: `#/components/schemas/${schemaPath.schemaName}`,
        };
      } else if (hasBodyParam) {
        // Check if there's a body parameter from @Param annotation
        const bodyParam = bodyParams[0]; // Use first body param
        if (bodyParam.model) {
          requestSchema = { $ref: `#/components/schemas/${bodyParam.model}` };
        } else {
          requestSchema = {
            type: bodyParam.type || "object",
            properties: {
              [bodyParam.name]: {
                type: bodyParam.type,
                enum: bodyParam.enum,
                description: bodyParam.description,
              },
            },
          };
          if (bodyParam.required) {
            requestSchema.required = [bodyParam.name];
          }
        }
      } else {
        requestSchema = this.getRequestBodySchema(
          route,
          controllerName,
          annotations
        );
      }

      if (requestSchema) {
        // Determine content type from @Accept annotation or default to application/json
        const contentType = annotations.Accept || "application/json";

        operation.requestBody = {
          required: true,
          content: {
            [contentType]: {
              schema: requestSchema,
            },
          },
        };
      }
    }

    // Add security for routes that need authentication
    if (this.requiresAuthentication(route)) {
      operation.security = [
        {
          bearerAuth: [],
        },
      ];
    }

    // Add responses
    operation.responses = this.generateResponses(
      route,
      controllerName,
      annotations
    );

    return operation;
  }

  requiresAuthentication(route) {
    // Check if route has @auth annotation
    if (route.annotations && route.annotations.auth) {
      return true;
    }

    // Fallback: Check if route typically requires authentication
    const authRoutes = ["admin", "logout"];
    return authRoutes.some((authRoute) => route.routerPath.includes(authRoute));
  }

  getRequestBodySchema(route, controllerName, annotations) {
    // First, check if there's a @request annotation
    if (annotations && annotations.request) {
      const schema = this.getSchema(annotations.request);
      if (schema) {
        return schema;
      }
      // If schema not found, reference it anyway (might be defined elsewhere)
      return { $ref: `#/components/schemas/${annotations.request}` };
    }

    // Fallback to legacy hardcoded schemas
    if (controllerName === "TagController") {
      if (route.httpMethod === "post") {
        return { $ref: "#/components/schemas/CreateTagRequest" };
      } else if (route.httpMethod === "put") {
        return { $ref: "#/components/schemas/UpdateTagRequest" };
      }
    } else if (
      controllerName === "UserController" &&
      route.method === "updateUserAccess"
    ) {
      return { $ref: "#/components/schemas/UpdateUserAccessRequest" };
    } else if (controllerName === "AuthController") {
      if (route.method === "apiLogin") {
        return { $ref: "#/components/schemas/LoginRequest" };
      } else if (route.method === "apiVerifyToken") {
        return { $ref: "#/components/schemas/VerifyTokenRequest" };
      }
    }

    // Generic request body for other controllers
    return {
      type: "object",
      properties: {
        data: {
          type: "object",
          description: "Request payload",
        },
      },
    };
  }

  generateResponses(route, controllerName, annotations) {
    const responses = {};
    const contentType = annotations.Produce || "application/json";

    // Handle Go-style @Success annotations
    if (annotations && annotations.Success && annotations.Success.length > 0) {
      annotations.Success.forEach((success) => {
        // Check if the model is a response schema with status code structure
        const responseSchema = this.getSchema(success.model);
        if (responseSchema && responseSchema[success.code]) {
          // Use the complete response definition from the response schema
          responses[success.code] = responseSchema[success.code];
        } else {
          // Fallback to simple schema reference
          responses[success.code] = {
            description: success.description || "Successful response",
            content: {
              [contentType]: {
                schema: success.model
                  ? { $ref: `#/components/schemas/${success.model}` }
                  : { type: success.type || "object" },
              },
            },
          };
        }
      });
    }

    // Handle Go-style @Failure annotations
    if (annotations && annotations.Failure && annotations.Failure.length > 0) {
      annotations.Failure.forEach((failure) => {
        responses[failure.code] = {
          description: failure.description || "Error response",
          content: {
            [contentType]: {
              schema: failure.model
                ? { $ref: `#/components/schemas/${failure.model}` }
                : { type: failure.type || "object" },
            },
          },
        };
      });
    }

    // Add default success response if no @Success was provided
    const hasSuccessResponse =
      annotations && annotations.Success && annotations.Success.length > 0;

    if (!hasSuccessResponse) {
      // Legacy @response handling
      if (annotations && annotations.response) {
        const responseSchema = this.getSchema(annotations.response);
        if (responseSchema) {
          // The response schema should contain status codes as keys
          Object.keys(responseSchema).forEach((statusCode) => {
            responses[statusCode] = responseSchema[statusCode];
          });
        } else {
          // Fallback: assume it's a 200 response
          responses["200"] = {
            description: "Successful response",
            content: {
              [contentType]: {
                schema: {
                  $ref: `#/components/schemas/${annotations.response}`,
                },
              },
            },
          };
        }
      } else {
        // Default success response
        responses["200"] = {
          description: "Successful response",
          content: {
            [contentType]: {
              schema: this.getResponseSchema(route, controllerName),
            },
          },
        };
      }
    }

    // Add error responses from @errors annotation
    if (annotations && annotations.errors && annotations.errors.length > 0) {
      annotations.errors.forEach((errorName) => {
        const errorSchema = this.getSchema(errorName);
        if (errorSchema) {
          // Determine status code from error name or properties
          let statusCode = "400"; // default
          if (errorName.includes("NotFound") || errorName.includes("404"))
            statusCode = "404";
          else if (
            errorName.includes("Unauthorized") ||
            errorName.includes("401")
          )
            statusCode = "401";
          else if (errorName.includes("Forbidden") || errorName.includes("403"))
            statusCode = "403";
          else if (
            errorName.includes("Validation") ||
            errorName.includes("422")
          )
            statusCode = "422";
          else if (
            errorName.includes("InternalServer") ||
            errorName.includes("500")
          )
            statusCode = "500";

          responses[statusCode] = {
            description: this.getErrorDescription(errorName),
            content: {
              "application/json": {
                schema: errorSchema,
              },
            },
          };
        } else {
          // Reference schema even if not found locally
          let statusCode = "400";
          if (errorName.includes("NotFound")) statusCode = "404";
          else if (errorName.includes("Unauthorized")) statusCode = "401";
          else if (errorName.includes("Forbidden")) statusCode = "403";

          responses[statusCode] = {
            description: this.getErrorDescription(errorName),
            content: {
              "application/json": {
                schema: { $ref: `#/components/schemas/${errorName}` },
              },
            },
          };
        }
      });
    } else {
      // Default error responses
      responses["400"] = {
        description: "Bad request",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/BadRequestError" },
          },
        },
      };
      responses["500"] = {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/InternalServerError" },
          },
        },
      };
    }

    return responses;
  }

  getErrorDescription(errorName) {
    const descriptions = {
      BadRequestError: "Bad request",
      UnauthorizedError: "Unauthorized",
      ForbiddenError: "Forbidden",
      NotFoundError: "Resource not found",
      ValidationError: "Validation failed",
      InternalServerError: "Internal server error",
    };
    return descriptions[errorName] || "Error";
  }

  legacyGenerateResponses(route, controllerName) {
    // Keep this for backward compatibility if needed
    const responses = {
      200: {
        description: "Successful response",
        content: {
          "application/json": {
            schema: this.getResponseSchema(route, controllerName),
          },
        },
      },
      400: {
        description: "Bad request",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/BadRequestError",
            },
          },
        },
      },
      500: {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/InternalServerError",
            },
          },
        },
      },
    };

    // Add specific error responses based on the route
    if (controllerName === "AuthController") {
      if (route.method === "apiLogin") {
        responses["401"] = {
          description: "Unauthorized - Invalid credentials",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/UnauthorizedError",
              },
            },
          },
        };
        responses["403"] = {
          description: "Account access denied",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AccountAccessDeniedError",
              },
            },
          },
        };
      } else if (route.method === "apiLogout") {
        responses["401"] = {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/UnauthorizedError",
              },
            },
          },
        };
      }
    } else if (controllerName === "UserController") {
      responses["401"] = {
        description: "Unauthorized - Admin access required",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/UnauthorizedError",
            },
          },
        },
      };
      if (route.method === "updateUserAccess") {
        responses["404"] = {
          description: "User not found",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/SimpleError",
              },
            },
          },
        };
      }
    }

    return responses;
  }

  getResponseSchema(route, controllerName) {
    if (controllerName === "TagController") {
      if (route.method === "GetTags") {
        return { $ref: "#/components/schemas/TagsResponse" };
      } else if (
        route.method === "GetTagById" ||
        route.method === "CreateTag" ||
        route.method === "UpdateTag"
      ) {
        return { $ref: "#/components/schemas/TagResponse" };
      } else if (route.method === "DeleteTag") {
        return {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Tag deleted successfully",
            },
          },
        };
      }
    } else if (controllerName === "AuthController") {
      if (route.method === "apiLogin") {
        return { $ref: "#/components/schemas/LoginResponse" };
      } else if (route.method === "apiLogout") {
        return { $ref: "#/components/schemas/LogoutResponse" };
      } else if (route.method === "apiVerifyToken") {
        return { $ref: "#/components/schemas/VerifyTokenResponse" };
      } else if (route.method === "apiRefreshToken") {
        return { $ref: "#/components/schemas/RefreshTokenResponse" };
      }
    } else if (controllerName === "NoteController") {
      return { $ref: "#/components/schemas/NotesResponse" };
    } else if (controllerName === "UserController") {
      if (route.method === "getUserAccess") {
        return { $ref: "#/components/schemas/UserAccessResponse" };
      } else if (route.method === "updateUserAccess") {
        return { $ref: "#/components/schemas/UpdateUserAccessResponse" };
      }
    }

    // Default response
    return { $ref: "#/components/schemas/BaseResponseWithData" };
  }

  addControllerSchemas(swaggerSpec, controllerName) {
    // Ensure base schemas exist
    if (!swaggerSpec.components.schemas.BaseResponse) {
      swaggerSpec.components.schemas = {
        ...swaggerSpec.components.schemas,
        ...this.getBaseSchemas(),
      };
    }

    // Add controller-specific schemas
    if (controllerName === "TagController") {
      swaggerSpec.components.schemas = {
        ...swaggerSpec.components.schemas,
        ...this.getTagSchemas(),
      };
    } else if (controllerName === "AuthController") {
      swaggerSpec.components.schemas = {
        ...swaggerSpec.components.schemas,
        ...this.getAuthSchemas(),
      };
    } else if (controllerName === "UserController") {
      swaggerSpec.components.schemas = {
        ...swaggerSpec.components.schemas,
        ...this.getUserSchemas(),
      };
    } else if (controllerName === "NoteController") {
      swaggerSpec.components.schemas = {
        ...swaggerSpec.components.schemas,
        ...this.getNoteSchemas(),
      };
    }
  }

  getBaseSchemas() {
    return {
      BaseResponse: {
        type: "object",
        properties: {
          code: {
            type: "integer",
            description: "HTTP status code",
          },
          message: {
            type: "string",
            description: "Response message",
          },
        },
      },
      BaseResponseWithData: {
        allOf: [
          {
            $ref: "#/components/schemas/BaseResponse",
          },
          {
            type: "object",
            properties: {
              data: {
                type: "object",
                description: "Response data payload",
              },
            },
          },
        ],
      },
      BadRequestError: {
        type: "object",
        properties: {
          error: {
            type: "string",
            example: "Bad request",
          },
          message: {
            type: "string",
            example: "Bad request",
          },
          statusCode: {
            type: "integer",
            example: 400,
          },
        },
      },
      UnauthorizedError: {
        type: "object",
        properties: {
          error: {
            type: "string",
            example: "Unauthorized",
          },
          message: {
            type: "string",
            example: "Unauthorized",
          },
          statusCode: {
            type: "integer",
            example: 401,
          },
        },
      },
      InternalServerError: {
        type: "object",
        properties: {
          error: {
            type: "string",
            example: "Internal server error",
          },
          message: {
            type: "string",
            example: "Internal server error",
          },
          statusCode: {
            type: "integer",
            example: 500,
          },
        },
      },
      SimpleError: {
        type: "object",
        properties: {
          code: {
            type: "integer",
            example: 400,
          },
          message: {
            type: "string",
            example: 'Invalid status. Must be either "active" or "suspend"',
          },
        },
      },
      AccountAccessDeniedError: {
        type: "object",
        properties: {
          code: {
            type: "integer",
            example: 403,
          },
          message: {
            type: "string",
            example: "Account access denied",
          },
          error: {
            type: "string",
            example:
              "Your account status is inactive. Please contact administrator.",
          },
        },
      },
    };
  }

  getTagSchemas() {
    return {
      Tag: {
        type: "object",
        properties: {
          id: {
            type: "string",
            example: "tag123",
          },
          name: {
            type: "string",
            example: "Rock",
          },
          description: {
            type: "string",
            example: "Rock music genre",
          },
          createdAt: {
            type: "string",
            format: "date-time",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
          },
        },
      },
      CreateTagRequest: {
        type: "object",
        required: ["name"],
        properties: {
          name: {
            type: "string",
            example: "Rock",
            description: "The name of the tag",
          },
          description: {
            type: "string",
            example: "Rock music genre",
            description: "Optional description of the tag",
          },
        },
      },
      UpdateTagRequest: {
        type: "object",
        properties: {
          name: {
            type: "string",
            example: "Rock",
            description: "The name of the tag",
          },
          description: {
            type: "string",
            example: "Rock music genre",
            description: "Optional description of the tag",
          },
        },
      },
      TagsResponse: {
        type: "object",
        properties: {
          message: {
            type: "string",
            example: "Get All Tags",
          },
          data: {
            type: "array",
            items: {
              $ref: "#/components/schemas/Tag",
            },
          },
        },
      },
      TagResponse: {
        type: "object",
        properties: {
          message: {
            type: "string",
            example: "Tag created successfully",
          },
          data: {
            $ref: "#/components/schemas/Tag",
          },
        },
      },
    };
  }

  getAuthSchemas() {
    return {
      User: {
        type: "object",
        properties: {
          id: {
            type: "string",
            example: "user123",
          },
          email: {
            type: "string",
            example: "user@example.com",
          },
          role: {
            type: "string",
            enum: ["admin", "member"],
            example: "member",
          },
          status: {
            type: "string",
            enum: ["active", "pending", "suspend", "request", "guest"],
            example: "active",
          },
          is_admin: {
            type: "boolean",
            example: false,
            description: "Only present for admin users",
          },
        },
      },
      LoginResponse: {
        allOf: [
          {
            $ref: "#/components/schemas/BaseResponseWithData",
          },
          {
            type: "object",
            properties: {
              code: {
                example: 200,
              },
              message: {
                example: "Login successful",
              },
              data: {
                type: "object",
                properties: {
                  token: {
                    type: "string",
                    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                  },
                  user: {
                    $ref: "#/components/schemas/User",
                  },
                },
              },
            },
          },
        ],
      },
      LogoutResponse: {
        type: "object",
        properties: {
          message: {
            type: "string",
            example: "Logout successful",
          },
        },
      },
      VerifyTokenRequest: {
        type: "object",
        required: ["token"],
        properties: {
          token: {
            type: "string",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          },
        },
      },
      VerifyTokenResponse: {
        allOf: [
          {
            $ref: "#/components/schemas/BaseResponseWithData",
          },
          {
            type: "object",
            properties: {
              code: {
                example: 200,
              },
              message: {
                example: "Token verified successfully",
              },
              data: {
                type: "object",
                properties: {
                  user: {
                    $ref: "#/components/schemas/User",
                  },
                },
              },
            },
          },
        ],
      },
      RefreshTokenResponse: {
        allOf: [
          {
            $ref: "#/components/schemas/BaseResponseWithData",
          },
          {
            type: "object",
            properties: {
              code: {
                example: 200,
              },
              message: {
                example: "Token refreshed successfully",
              },
              data: {
                type: "object",
                properties: {
                  token: {
                    type: "string",
                    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                  },
                },
              },
            },
          },
        ],
      },
    };
  }

  getUserSchemas() {
    return {
      UserAccessResponse: {
        allOf: [
          {
            $ref: "#/components/schemas/BaseResponseWithData",
          },
          {
            type: "object",
            properties: {
              code: {
                example: 200,
              },
              message: {
                example: "User access list retrieved successfully",
              },
              data: {
                type: "object",
                properties: {
                  active_users: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/User",
                    },
                  },
                  request_users: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/User",
                    },
                  },
                  suspended_users: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/User",
                    },
                  },
                },
              },
            },
          },
        ],
      },
      UpdateUserAccessRequest: {
        type: "object",
        required: ["status"],
        properties: {
          status: {
            type: "string",
            enum: ["active", "suspend"],
            example: "active",
          },
        },
      },
      UpdateUserAccessResponse: {
        allOf: [
          {
            $ref: "#/components/schemas/BaseResponseWithData",
          },
          {
            type: "object",
            properties: {
              code: {
                example: 200,
              },
              message: {
                example: "User access updated successfully",
              },
              data: {
                type: "object",
                properties: {
                  id: {
                    type: "string",
                    example: "user123",
                  },
                  status: {
                    type: "string",
                    example: "active",
                  },
                },
              },
            },
          },
        ],
      },
    };
  }

  getNoteSchemas() {
    return {
      Song: {
        type: "object",
        properties: {
          id: {
            type: "string",
            example: "song123",
          },
          title: {
            type: "string",
            example: "Song Title",
          },
          artist: {
            type: "string",
            example: "Artist Name",
          },
        },
      },
      Note: {
        type: "object",
        properties: {
          id: {
            type: "string",
            example: "note123",
          },
          notes: {
            type: "string",
            example: "This is a note",
          },
          createdAt: {
            type: "string",
            format: "date-time",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
          },
          Song: {
            $ref: "#/components/schemas/Song",
          },
        },
      },
      NotesResponse: {
        type: "object",
        properties: {
          message: {
            type: "string",
            example: "Get All Notes",
          },
          id: {
            type: "string",
            example: "user123",
          },
          data: {
            type: "array",
            items: {
              $ref: "#/components/schemas/Note",
            },
          },
        },
      },
    };
  }

  generateMethodSummaryAndDescription(route) {
    const methodName = route.method;

    // Method-specific summaries based on common patterns
    const summaryMap = {
      GetTags: {
        summary: "Get all tags",
        description: "Retrieve all available tags",
      },
      GetTagById: {
        summary: "Get tag by ID",
        description: "Retrieve a specific tag by its ID",
      },
      CreateTag: {
        summary: "Create new tag",
        description: "Create a new tag with name and description",
      },
      UpdateTag: {
        summary: "Update tag",
        description: "Update an existing tag by ID",
      },
      DeleteTag: { summary: "Delete tag", description: "Delete a tag by ID" },
      GetNoteByUserId: {
        summary: "Get notes by user ID",
        description: "Retrieve all notes for a specific user",
      },
      getUserAccess: {
        summary: "Retrieve user access list",
        description:
          "Get a list of users with their access status for admin management",
      },
      updateUserAccess: {
        summary: "Update user access status",
        description:
          "Admin can update the status for a specific user (active or suspend)",
      },
      apiLogin: {
        summary: "User login",
        description: "Authenticate user with email and password",
      },
      apiLogout: {
        summary: "User logout",
        description: "Logout authenticated user",
      },
    };

    if (summaryMap[methodName]) {
      return summaryMap[methodName];
    }

    // Fallback to generic summaries
    const httpMethod = route.httpMethod.toUpperCase();
    return {
      summary: `${httpMethod} ${route.routerPath}`,
      description: `Auto-generated endpoint for ${route.fullMethodName}`,
    };
  }

  // Methods from original file
  scanControllers() {
    const controllers = {};

    if (!fs.existsSync(this.controllersPath)) {
      console.warn("⚠️  Controllers directory not found");
      return controllers;
    }

    const files = fs
      .readdirSync(this.controllersPath)
      .filter((file) => file.endsWith(".js") && !file.includes("Error"));

    for (const file of files) {
      const controllerName = path.basename(file, ".js");
      const controllerPath = path.join(this.controllersPath, file);

      try {
        const content = fs.readFileSync(controllerPath, "utf8");
        controllers[controllerName] = this.parseController(
          content,
          controllerName
        );
      } catch (error) {
        console.warn(
          `⚠️  Error parsing controller ${controllerName}: ${error.message}`
        );
      }
    }

    return controllers;
  }

  parseController(content, controllerName) {
    const controller = {
      name: controllerName,
      methods: this.extractControllerMethods(content),
    };

    return controller;
  }

  extractControllerMethods(content) {
    const methods = {};

    // Match both static async methods and static arrow function methods
    const lines = content.split("\n");
    let inJSDocBlock = false;
    let currentJSDoc = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check for JSDoc comment blocks
      if (line.includes("/**")) {
        inJSDocBlock = true;
        currentJSDoc = [line];
        continue;
      }
      if (inJSDocBlock) {
        currentJSDoc.push(line);
        if (line.includes("*/")) {
          inJSDocBlock = false;
          // Keep JSDoc for the next method
        }
        continue;
      }

      // Skip if commented line
      if (line.startsWith("//")) {
        continue;
      }

      // Match static async methods: static async methodName(...)
      const asyncMethodMatch = line.match(/static\s+async\s+(\w+)\s*\([^)]*\)/);
      if (asyncMethodMatch) {
        const methodName = asyncMethodMatch[1];
        const annotations = this.parseJSDocAnnotations(currentJSDoc);

        // Use HTTP method from Router annotation if available, otherwise infer
        let httpMethod = this.inferHttpMethod(methodName);
        if (
          annotations.Router &&
          typeof annotations.Router === "object" &&
          annotations.Router.method
        ) {
          httpMethod = annotations.Router.method;
        }

        methods[methodName] = {
          name: methodName,
          isAsync: true,
          httpMethod: httpMethod,
          lineNumber: i + 1,
          jsDoc: currentJSDoc.join("\n"),
          annotations: annotations,
        };
        currentJSDoc = [];
        continue;
      }

      // Match static arrow function methods: static MethodName = ErrorHandler.asyncHandler(async (req, res) =>
      const arrowMethodMatch = line.match(
        /static\s+(\w+)\s*=\s*ErrorHandler\.asyncHandler\s*\(\s*async/
      );
      if (arrowMethodMatch) {
        const methodName = arrowMethodMatch[1];
        const annotations = this.parseJSDocAnnotations(currentJSDoc);

        // Use HTTP method from Router annotation if available, otherwise infer
        let httpMethod = this.inferHttpMethod(methodName);
        if (
          annotations.Router &&
          typeof annotations.Router === "object" &&
          annotations.Router.method
        ) {
          httpMethod = annotations.Router.method;
        }

        methods[methodName] = {
          name: methodName,
          isAsync: true,
          httpMethod: httpMethod,
          lineNumber: i + 1,
          jsDoc: currentJSDoc.join("\n"),
          annotations: annotations,
        };
        currentJSDoc = [];
        continue;
      }

      // Match other static methods: static methodName =
      const staticMethodMatch = line.match(/static\s+(\w+)\s*=/);
      if (staticMethodMatch) {
        const methodName = staticMethodMatch[1];
        const annotations = this.parseJSDocAnnotations(currentJSDoc);

        // Use HTTP method from Router annotation if available, otherwise infer
        let httpMethod = this.inferHttpMethod(methodName);
        if (
          annotations.Router &&
          typeof annotations.Router === "object" &&
          annotations.Router.method
        ) {
          httpMethod = annotations.Router.method;
        }

        methods[methodName] = {
          name: methodName,
          isAsync: false,
          httpMethod: httpMethod,
          lineNumber: i + 1,
          jsDoc: currentJSDoc.join("\n"),
          annotations: annotations,
        };
        currentJSDoc = [];
      }
    }

    return methods;
  }

  parseJSDocAnnotations(jsDocLines) {
    const annotations = {
      // Legacy format support
      group: null,
      resource: null,
      summary: null,
      endpointPath: null,
      response: null,
      request: null,
      errors: [],

      // Go-style format support
      Summary: null,
      Description: null,
      Tags: null,
      Accept: null,
      Produce: null,
      Param: [],
      Body: null,
      Success: [],
      Failure: [],
      Router: null,
      auth: false,
    };

    jsDocLines.forEach((line) => {
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

      // Extract @response annotation
      const responseMatch = trimmed.match(/@response\s+(\w+)/);
      if (responseMatch) {
        annotations.response = responseMatch[1];
      }

      // Extract @request annotation
      const requestMatch = trimmed.match(/@request\s+(\w+)/);
      if (requestMatch) {
        annotations.request = requestMatch[1];
      }

      // Extract @errors annotation (can be multiple, comma-separated)
      const errorsMatch = trimmed.match(/@errors\s+(.+)/);
      if (errorsMatch) {
        const errorsList = errorsMatch[1].split(",").map((e) => e.trim());
        annotations.errors = errorsList;
      }

      // Go-style annotations parsing

      // Extract @Summary annotation
      const SummaryMatch = trimmed.match(/@Summary\s+(.+)/);
      if (SummaryMatch) {
        annotations.Summary = SummaryMatch[1];
      }

      // Extract @Description annotation
      const DescriptionMatch = trimmed.match(/@Description\s+(.+)/);
      if (DescriptionMatch) {
        annotations.Description = DescriptionMatch[1];
      }

      // Extract @Tags annotation
      const TagsMatch = trimmed.match(/@Tags\s+(.+)/);
      if (TagsMatch) {
        annotations.Tags = TagsMatch[1];
      }

      // Extract @Accept annotation
      const AcceptMatch = trimmed.match(/@Accept\s+(.+)/);
      if (AcceptMatch) {
        annotations.Accept = AcceptMatch[1];
      }

      // Extract @Produce annotation
      const ProduceMatch = trimmed.match(/@Produce\s+(.+)/);
      if (ProduceMatch) {
        annotations.Produce = ProduceMatch[1];
      }

      // Extract @Param annotation
      // Format: @Param name location type required "description" [default(value)]
      const ParamMatch = trimmed.match(/@Param\s+(.+)/);
      if (ParamMatch) {
        const paramString = ParamMatch[1];
        const paramParts = this.parseParamString(paramString);
        if (paramParts) {
          annotations.Param.push(paramParts);
        }
      }

      // Extract @Body annotation
      // Format: @Body {object} dir.SchemaName "description"
      const BodyMatch = trimmed.match(
        /@Body\s+\{([^}]+)\}\s+([^\s"]+)(?:\s+"([^"]*)")?/
      );
      if (BodyMatch) {
        annotations.Body = {
          type: BodyMatch[1],
          schema: BodyMatch[2],
          description: BodyMatch[3] || "",
        };
      }

      // Extract @Success annotation
      // Format: @Success code {object} model.ResponseType "description"
      const SuccessMatch = trimmed.match(
        /@Success\s+(\d+)\s+\{([^}]+)\}\s+([^\s"]+)(?:\s+"([^"]*)")?/
      );
      if (SuccessMatch) {
        annotations.Success.push({
          code: SuccessMatch[1],
          type: SuccessMatch[2],
          model: SuccessMatch[3],
          description: SuccessMatch[4] || "",
        });
      }

      // Extract @Failure annotation
      // Format: @Failure code {object} model.ErrorType "description"
      const FailureMatch = trimmed.match(
        /@Failure\s+(\d+)\s+\{([^}]+)\}\s+([^\s"]+)(?:\s+"([^"]*)")?/
      );
      if (FailureMatch) {
        annotations.Failure.push({
          code: FailureMatch[1],
          type: FailureMatch[2],
          model: FailureMatch[3],
          description: FailureMatch[4] || "",
        });
      }

      // Extract @Router annotation
      // Format: @Router /path [method]
      const RouterMatch = trimmed.match(/@Router\s+(.+)\s+\[(\w+)\]/);
      if (RouterMatch) {
        annotations.Router = {
          path: RouterMatch[1],
          method: RouterMatch[2].toLowerCase(),
        };
      }

      // Extract @auth annotation
      const AuthMatch = trimmed.match(/@auth/);
      if (AuthMatch) {
        annotations.auth = true;
      }

      // Extract endpoint path from comments like "GET /api/users"
      const pathMatch = trimmed.match(
        /^\*\s*(GET|POST|PUT|DELETE)\s+(\/[/\w\-:]+)/
      );
      if (pathMatch) {
        annotations.endpointPath = pathMatch[2];
      }

      // Also check for paths in summary comments
      const summaryPathMatch = trimmed.match(
        /^\*\s*(GET|POST|PUT|DELETE)\s+(\/api\/[/\w\-:]+)/
      );
      if (summaryPathMatch) {
        annotations.endpointPath = summaryPathMatch[2];
      }
    });

    return annotations;
  }

  parseParamString(paramString) {
    // Parse parameter string like: "name location type required description" or "model.Type header model.ModelType true "description""
    const parts = [];
    let current = "";
    let inQuotes = false;
    let inBrackets = false;

    for (let i = 0; i < paramString.length; i++) {
      const char = paramString[i];

      if (char === '"' && !inBrackets) {
        inQuotes = !inQuotes;
        if (!inQuotes && current.trim()) {
          parts.push(current.trim());
          current = "";
        }
      } else if (char === "[" && !inQuotes) {
        inBrackets = true;
        current += char;
      } else if (char === "]" && !inQuotes) {
        inBrackets = false;
        current += char;
      } else if (char === " " && !inQuotes && !inBrackets) {
        if (current.trim()) {
          parts.push(current.trim());
          current = "";
        }
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      parts.push(current.trim());
    }

    if (parts.length >= 4) {
      const param = {
        name: parts[0],
        in: parts[1], // header, path, query, body
        type: parts[2],
        required: parts[3] === "true",
        description: parts[4] || "",
      };

      // Handle default values like default(1)
      if (parts.length > 5 && parts[5].startsWith("default(")) {
        const defaultMatch = parts[5].match(/default\((.+)\)/);
        if (defaultMatch) {
          param.default = defaultMatch[1];
        }
      }

      // Handle enum values like enum:["value1","value2"]
      for (let i = 5; i < parts.length; i++) {
        if (parts[i].startsWith("enum:[")) {
          const enumMatch = parts[i].match(/enum:\[(.*)\]/);
          if (enumMatch) {
            try {
              // Parse enum values, handling quoted strings
              const enumStr = enumMatch[1];
              param.enum = enumStr
                .split(",")
                .map((val) => val.trim().replace(/^"|"$/g, ""));
            } catch (error) {
              console.warn(`Warning: Could not parse enum values: ${parts[i]}`);
            }
          }
          break;
        }
      }

      return param;
    }

    return null;
  }

  inferHttpMethod(methodName) {
    const methodMap = {
      index: "get",
      show: "get",
      create: "post",
      update: "put",
      destroy: "delete",
      delete: "delete",
    };

    const lowerMethod = methodName.toLowerCase();

    // Specific auth method mappings
    if (lowerMethod.includes("apilogin")) return "post";
    if (lowerMethod.includes("apilogout")) return "post";
    if (lowerMethod.includes("apiverifytoken")) return "post";
    if (lowerMethod.includes("apirefreshtoken")) return "post";
    if (lowerMethod.includes("apichangepassword")) return "post";
    if (lowerMethod.includes("apiupdateprofile")) return "put";

    // Specific playlist method mappings
    if (lowerMethod.includes("generateshareablelink")) return "post";
    if (lowerMethod.includes("joinplaylistvialink")) return "post";
    if (lowerMethod.includes("getsharedplaylistdetails")) return "get";
    if (lowerMethod.includes("addsongtoplaylist")) return "post";
    if (lowerMethod.includes("removesongfromplaylist")) return "delete";
    if (lowerMethod.includes("reorderplaylistsongs")) return "put";
    if (lowerMethod.includes("getuserplaylists")) return "get";

    // Specific playlist team method mappings
    if (lowerMethod.includes("invitemembertoteam")) return "post";
    if (lowerMethod.includes("updateteamvisibility")) return "put";
    if (lowerMethod.includes("addmembertoteam")) return "post";
    if (lowerMethod.includes("removememberfromteam")) return "delete";
    if (lowerMethod.includes("updatememberrole")) return "put";
    if (lowerMethod.includes("getuserteams")) return "get";

    // Specific song method mappings
    if (lowerMethod.includes("addtagtosong")) return "post";
    if (lowerMethod.includes("removetagfromsong")) return "delete";

    // Other specific mappings
    if (lowerMethod.includes("requestvolaccess")) return "post";

    for (const [pattern, httpMethod] of Object.entries(methodMap)) {
      if (lowerMethod.includes(pattern)) {
        return httpMethod;
      }
    }

    if (lowerMethod.includes("get")) return "get";
    if (lowerMethod.includes("post")) return "post";
    if (lowerMethod.includes("put") || lowerMethod.includes("update"))
      return "put";
    if (lowerMethod.includes("delete")) return "delete";

    return "get";
  }

  generateRoutePath(route) {
    const controller = route.controller.replace("Controller", "").toLowerCase();
    const method = route.method.toLowerCase();

    // First check if there's an explicit endpoint path from JSDoc annotations
    if (route.annotations && route.annotations.endpointPath) {
      return route.annotations.endpointPath.replace("/api", "");
    }

    // Note-specific endpoints (MUST come before general patterns)
    if (
      method.includes("createnoteforsong") ||
      method.includes("createnotefor")
    ) {
      return `/api/notes/:user_id/:song_id`;
    }
    if (method.includes("getallusernotes") || method.includes("getalluser")) {
      return `/api/notes/:user_id`;
    }
    if (method.includes("getnotebyid") && controller === "note") {
      return `/api/notes/:user_id/:id`;
    }
    if (method.includes("updatenote") && controller === "note") {
      return `/api/notes/:user_id/:id`;
    }
    if (method.includes("deletenote") && controller === "note") {
      return `/api/notes/:user_id/:id`;
    }
    if (method.includes("getrecentnotes")) {
      return `/api/notes`;
    }
    if (method.includes("createnote") && !method.includes("forsong")) {
      return `/api/notes`;
    }

    // Playlist-specific endpoints (MUST come before general patterns)
    if (controller === "playlist") {
      if (method.includes("getuserplaylists")) {
        return `/api/users/:user_id/playlists`;
      }
      if (method.includes("addsongtoplaylist")) {
        return `/api/playlists/:id/songs/:song_id`;
      }
      if (method.includes("removesongfromplaylist")) {
        return `/api/playlists/:id/songs/:song_id`;
      }
      if (method.includes("reorderplaylistsongs")) {
        return `/api/playlists/:id/reorder`;
      }
      if (method.includes("generateshareablelink")) {
        return `/api/playlists/:id/share`;
      }
      if (method.includes("joinplaylistvialink")) {
        return `/api/playlists/join/:share_token`;
      }
      if (method.includes("getsharedplaylistdetails")) {
        return `/api/playlists/shared/:share_token`;
      }
    }

    // PlaylistTeam-specific endpoints
    if (controller === "playlistteam") {
      if (method.includes("addmembertoteam")) {
        return `/api/playlistteams/:id/members`;
      }
      if (method.includes("removememberfromteam")) {
        return `/api/playlistteams/:id/members/:member_id`;
      }
      if (method.includes("updatememberrole")) {
        return `/api/playlistteams/:id/members/:member_id/role`;
      }
      if (method.includes("getuserteams")) {
        return `/api/users/:user_id/teams`;
      }
      if (method.includes("invitemembertoteam")) {
        return `/api/playlistteams/:id/invite`;
      }
      if (method.includes("updateteamvisibility")) {
        return `/api/playlistteams/:id/visibility`;
      }
    }

    // Song-specific endpoints
    if (controller === "song") {
      if (method.includes("addtagtosong")) {
        return `/api/songs/:id/tags`;
      }
      if (method.includes("removetagfromsong")) {
        return `/api/songs/:id/tags/:tag_id`;
      }
    }

    // Special cases for other controllers
    if (
      method.includes("getuseraccess") ||
      method.includes("updateuseraccess")
    ) {
      return method.includes("update")
        ? `/api/users/:id`
        : `/api/admin/user-access`;
    }

    // Auth endpoints
    if (method.includes("apilogin")) {
      return `/api/auth/login`;
    }
    if (method.includes("apilogout")) {
      return `/api/auth/logout`;
    }
    if (method.includes("apiverifytoken")) {
      return `/api/auth/verify`;
    }
    if (method.includes("apirefreshtoken")) {
      return `/api/auth/refresh`;
    }
    if (method.includes("apichangepassword")) {
      return `/api/auth/change-password`;
    }
    if (method.includes("apiupdateprofile")) {
      return `/api/auth/profile`;
    }

    // Generate RESTful paths based on method patterns (fallback)
    if (method.includes("getall") || method.includes("index")) {
      return `/api/${controller}s`;
    } else if (method.includes("getbyid") || method.includes("show")) {
      return `/api/${controller}s/:id`;
    } else if (method.includes("create") || method.includes("store")) {
      return `/api/${controller}s`;
    } else if (method.includes("update")) {
      return `/api/${controller}s/:id`;
    } else if (method.includes("delete") || method.includes("destroy")) {
      return `/api/${controller}s/:id`;
    }

    // Default fallback
    return `/api/${controller}s`;
  }
}

// Run the command if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new SwaggerCommand();
  await generator.execute();
}

export default SwaggerCommand;
