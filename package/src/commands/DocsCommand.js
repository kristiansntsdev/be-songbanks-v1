#!/usr/bin/env node

import fs from "fs";
import path from "path";

class DocsCommand {
  constructor() {
    this.args = process.argv.slice(2);
    this.basePath = process.cwd();
    this.controllersPath = path.join(this.basePath, "app/controllers");
    this.outputPath = path.join(this.basePath, "swagger/swagger.json");
  }

  execute() {
    const options = this.parseArguments();

    if (options.generate) {
      this.generateDocs();
    } else {
      this.showUsage();
    }
  }

  parseArguments() {
    const options = {};

    for (let i = 0; i < this.args.length; i++) {
      const arg = this.args[i];
      if (arg === "--generate") {
        options.generate = true;
      }
    }

    return options;
  }

  showUsage() {
    console.log(`
🚀 Swagpress Docs Generator (Laravel-inspired)

Usage:
  npm run swagpress:docs --generate    Auto-generate complete API documentation

Examples:
  npm run swagpress:docs --generate

Features:
  • Convention over configuration
  • Auto-discovers all controllers
  • Standardized response formats
  • Laravel-style route patterns
        `);
  }

  generateDocs() {
    console.log("🔍 Auto-discovering controllers...");

    const controllers = this.scanControllers();
    const controllerNames = Object.keys(controllers);

    if (controllerNames.length === 0) {
      console.error("❌ No controllers found in app/controllers/");
      return;
    }

    console.log(
      `📝 Found ${controllerNames.length} controller(s): ${controllerNames.join(", ")}`
    );

    // Generate complete swagger spec
    const swaggerSpec = this.generateCompleteSwaggerSpec(controllers);

    // Ensure swagger directory exists
    this.ensureDirectoryExists(path.dirname(this.outputPath));

    // Write swagger.json
    fs.writeFileSync(this.outputPath, JSON.stringify(swaggerSpec, null, 2));

    console.log(
      `✅ Generated complete API documentation: swagger/swagger.json`
    );
    console.log(`📊 Total endpoints: ${this.countEndpoints(swaggerSpec)}`);
    console.log(`💡 View docs at: http://localhost:3000/api-docs`);
  }

  scanControllers() {
    const controllers = {};

    if (!fs.existsSync(this.controllersPath)) {
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
        console.warn(`⚠️  Error parsing ${controllerName}: ${error.message}`);
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
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Match static async methods
      const methodMatch = line.match(/static\s+async\s+(\w+)\s*\([^)]*\)/);
      if (methodMatch) {
        const methodName = methodMatch[1];

        methods[methodName] = {
          name: methodName,
          httpMethod: this.inferHttpMethod(methodName),
          lineNumber: i + 1,
        };
      }
    }

    return methods;
  }

  inferHttpMethod(methodName) {
    const lowerMethod = methodName.toLowerCase();

    // Laravel-style method mapping
    if (
      lowerMethod.includes("index") ||
      lowerMethod.includes("show") ||
      lowerMethod.includes("get")
    ) {
      return "get";
    }
    if (
      lowerMethod.includes("store") ||
      lowerMethod.includes("create") ||
      lowerMethod.includes("post")
    ) {
      return "post";
    }
    if (lowerMethod.includes("update") || lowerMethod.includes("put")) {
      return "put";
    }
    if (lowerMethod.includes("destroy") || lowerMethod.includes("delete")) {
      return "delete";
    }

    return "get"; // Default
  }

  generateCompleteSwaggerSpec(controllers) {
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
          url: "https://api.tahumeat.com/api",
          description: "Production server",
        },
      ],
      components: {
        schemas: this.getStandardSchemas(),
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

    // Generate paths for all controllers
    Object.keys(controllers).forEach((controllerName) => {
      const controller = controllers[controllerName];
      this.addControllerPaths(swaggerSpec, controllerName, controller);
    });

    return swaggerSpec;
  }

  addControllerPaths(swaggerSpec, controllerName, controller) {
    const entityName = controllerName.replace("Controller", "").toLowerCase();

    Object.keys(controller.methods).forEach((methodName) => {
      const method = controller.methods[methodName];
      const route = this.generateRoute(
        controllerName,
        methodName,
        method.httpMethod
      );

      if (!swaggerSpec.paths[route.swaggerPath]) {
        swaggerSpec.paths[route.swaggerPath] = {};
      }

      swaggerSpec.paths[route.swaggerPath][method.httpMethod] =
        this.generateOperation(
          controllerName,
          methodName,
          method.httpMethod,
          route
        );
    });
  }

  generateRoute(controllerName, methodName, httpMethod) {
    const entity = controllerName.replace("Controller", "").toLowerCase();
    const lowerMethod = methodName.toLowerCase();

    // Special routes for Auth
    if (controllerName === "AuthController") {
      if (lowerMethod.includes("login")) {
        return {
          path: "/api/auth/login",
          swaggerPath: "/auth/login",
        };
      }
      if (lowerMethod.includes("logout")) {
        return {
          path: "/api/auth/logout",
          swaggerPath: "/auth/logout",
        };
      }
    }

    // Special routes for Admin
    if (controllerName === "UserController" && lowerMethod.includes("access")) {
      if (lowerMethod.includes("update")) {
        return {
          path: "/api/admin/user-access/:user_id",
          swaggerPath: "/admin/user-access/{user_id}",
        };
      }
      return {
        path: "/api/admin/user-access",
        swaggerPath: "/admin/user-access",
      };
    }

    // Standard REST routes
    if (
      lowerMethod.includes("index") ||
      (httpMethod === "get" && !lowerMethod.includes("show"))
    ) {
      return {
        path: `/api/${entity}s`,
        swaggerPath: `/${entity}s/`,
      };
    }
    if (lowerMethod.includes("show") || lowerMethod.includes("byid")) {
      return {
        path: `/api/${entity}s/:id`,
        swaggerPath: `/${entity}s/{id}`,
      };
    }
    if (httpMethod === "post") {
      return {
        path: `/api/${entity}s`,
        swaggerPath: `/${entity}s/`,
      };
    }
    if (httpMethod === "put") {
      return {
        path: `/api/${entity}s/:id`,
        swaggerPath: `/${entity}s/{id}`,
      };
    }
    if (httpMethod === "delete") {
      return {
        path: `/api/${entity}s/:id`,
        swaggerPath: `/${entity}s/{id}`,
      };
    }

    // Special case for notes by user
    if (entity === "note" && lowerMethod.includes("user")) {
      return {
        path: "/api/notes/:user_id",
        swaggerPath: "/notes/{user_id}",
      };
    }

    // Default fallback
    return {
      path: `/api/${entity}s`,
      swaggerPath: `/${entity}s/`,
    };
  }

  generateOperation(controllerName, methodName, httpMethod, route) {
    const tag = controllerName.replace("Controller", "");
    const entity = tag.toLowerCase();

    const operation = {
      summary: this.generateSummary(methodName, httpMethod, entity),
      description: this.generateDescription(methodName, httpMethod, entity),
      tags: [tag],
    };

    // Add parameters for paths with {id} or {user_id}
    if (route.swaggerPath.includes("{")) {
      const paramName = route.swaggerPath.includes("{user_id}")
        ? "user_id"
        : "id";
      operation.parameters = [
        {
          in: "path",
          name: paramName,
          required: true,
          schema: { type: "string" },
          description:
            paramName === "user_id" ? "The user ID" : `The ${entity} ID`,
        },
      ];
    }

    // Add request body for POST/PUT
    if (httpMethod === "post" || httpMethod === "put") {
      operation.requestBody = {
        required: true,
        content: {
          "application/json": {
            schema: this.getRequestSchema(controllerName, methodName),
          },
        },
      };
    }

    // Add security for admin routes
    if (route.path.includes("/admin/") || methodName.includes("logout")) {
      operation.security = [{ bearerAuth: [] }];
    }

    // Add responses
    operation.responses = this.getStandardResponses(controllerName, methodName);

    return operation;
  }

  generateSummary(methodName, httpMethod, entity) {
    const lowerMethod = methodName.toLowerCase();
    const upperHttp = httpMethod.toUpperCase();

    if (lowerMethod.includes("login")) return "User login";
    if (lowerMethod.includes("logout")) return "User logout";
    if (
      lowerMethod.includes("index") ||
      (httpMethod === "get" && !lowerMethod.includes("show"))
    ) {
      return `Get all ${entity}s`;
    }
    if (lowerMethod.includes("show") || lowerMethod.includes("byid")) {
      return `Get ${entity} by ID`;
    }
    if (httpMethod === "post") return `Create new ${entity}`;
    if (httpMethod === "put") return `Update ${entity}`;
    if (httpMethod === "delete") return `Delete ${entity}`;

    return `${upperHttp} ${entity}`;
  }

  generateDescription(methodName, httpMethod, entity) {
    const lowerMethod = methodName.toLowerCase();

    if (lowerMethod.includes("login"))
      return "Authenticate user with email and password";
    if (lowerMethod.includes("logout")) return "Logout authenticated user";
    if (lowerMethod.includes("index"))
      return `Retrieve paginated list of ${entity}s`;
    if (lowerMethod.includes("show") || lowerMethod.includes("byid")) {
      return `Retrieve a specific ${entity} by its ID`;
    }
    if (httpMethod === "post")
      return `Create a new ${entity} with provided data`;
    if (httpMethod === "put") return `Update an existing ${entity} by ID`;
    if (httpMethod === "delete") return `Delete a ${entity} by ID`;

    return `Auto-generated endpoint for ${methodName}`;
  }

  getRequestSchema(controllerName, methodName) {
    // Return appropriate schema references
    if (controllerName === "AuthController" && methodName.includes("login")) {
      return { $ref: "#/components/schemas/LoginRequest" };
    }
    if (controllerName === "TagController") {
      if (methodName.includes("create")) {
        return { $ref: "#/components/schemas/CreateTagRequest" };
      }
      if (methodName.includes("update")) {
        return { $ref: "#/components/schemas/UpdateTagRequest" };
      }
    }

    // Generic request body
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

  getStandardResponses(controllerName, methodName) {
    const responses = {
      200: {
        description: "Successful response",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/BaseResponseWithData" },
          },
        },
      },
      400: {
        description: "Bad request",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/BadRequestError" },
          },
        },
      },
      500: {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/InternalServerError" },
          },
        },
      },
    };

    // Add auth-specific responses
    if (controllerName === "AuthController") {
      if (methodName.includes("login")) {
        responses["200"].content["application/json"].schema = {
          $ref: "#/components/schemas/LoginResponse",
        };
        responses["401"] = {
          description: "Unauthorized - Invalid credentials",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UnauthorizedError" },
            },
          },
        };
        responses["403"] = {
          description: "Account access denied",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AccountAccessDeniedError" },
            },
          },
        };
      }
      if (methodName.includes("logout")) {
        responses["200"].content["application/json"].schema = {
          $ref: "#/components/schemas/LogoutResponse",
        };
        responses["401"] = {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UnauthorizedError" },
            },
          },
        };
      }
    }

    return responses;
  }

  getStandardSchemas() {
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
          { $ref: "#/components/schemas/BaseResponse" },
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
          error: { type: "string", example: "Bad request" },
          message: { type: "string", example: "Bad request" },
          statusCode: { type: "integer", example: 400 },
        },
      },
      UnauthorizedError: {
        type: "object",
        properties: {
          error: { type: "string", example: "Unauthorized" },
          message: { type: "string", example: "Unauthorized" },
          statusCode: { type: "integer", example: 401 },
        },
      },
      InternalServerError: {
        type: "object",
        properties: {
          error: { type: "string", example: "Internal server error" },
          message: { type: "string", example: "Internal server error" },
          statusCode: { type: "integer", example: 500 },
        },
      },
      AccountAccessDeniedError: {
        type: "object",
        properties: {
          code: { type: "integer", example: 403 },
          message: { type: "string", example: "Account access denied" },
          error: {
            type: "string",
            example:
              "Your account status is inactive. Please contact administrator.",
          },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", example: "user123" },
          email: { type: "string", example: "user@example.com" },
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
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "user@example.com",
          },
          password: { type: "string", example: "password123" },
        },
      },
      LoginResponse: {
        allOf: [
          { $ref: "#/components/schemas/BaseResponseWithData" },
          {
            type: "object",
            properties: {
              code: { example: 200 },
              message: { example: "Login successful" },
              data: {
                type: "object",
                properties: {
                  token: {
                    type: "string",
                    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                  },
                  user: { $ref: "#/components/schemas/User" },
                },
              },
            },
          },
        ],
      },
      LogoutResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Logout successful" },
        },
      },
      Tag: {
        type: "object",
        properties: {
          id: { type: "string", example: "tag123" },
          name: { type: "string", example: "Rock" },
          description: { type: "string", example: "Rock music genre" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
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
    };
  }

  countEndpoints(swaggerSpec) {
    let count = 0;
    Object.keys(swaggerSpec.paths).forEach((path) => {
      count += Object.keys(swaggerSpec.paths[path]).length;
    });
    return count;
  }

  ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}

// Run the command if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = new DocsCommand();
  command.execute();
}

export default DocsCommand;
