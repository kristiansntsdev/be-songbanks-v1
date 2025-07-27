#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

class MakeCommand {
  constructor() {
    this.args = process.argv.slice(2);
    this.basePath = process.cwd();
    this.templatesPath = path.join(__dirname, "../stubs");
  }

  execute() {
    const options = this.parseArguments();

    if (!options.type || !options.name) {
      this.showUsage();
      return;
    }

    switch (options.type) {
      case "controller":
        this.makeController(options.name);
        break;
      case "service":
        this.makeService(options.name);
        break;
      case "model":
        this.makeModel(options.name);
        break;
      default:
        console.error(`❌ Unknown type: ${options.type}`);
        this.showUsage();
    }
  }

  parseArguments() {
    const options = {};

    for (let i = 0; i < this.args.length; i++) {
      const arg = this.args[i];

      if (arg === "--controller") {
        options.type = "controller";
      } else if (arg === "--service") {
        options.type = "service";
      } else if (arg === "--model") {
        options.type = "model";
      } else if (arg.startsWith("--name=")) {
        options.name = arg.split("=")[1];
      }
    }

    return options;
  }

  showUsage() {
    console.log(`
🚀 Swagpress Make Command (Laravel-inspired)

Usage:
  npm run swagpress:make --controller --name=ControllerName
  npm run swagpress:make --service --name=ServiceName
  npm run swagpress:make --model --name=ModelName

Examples:
  npm run swagpress:make --controller --name=AuthController
  npm run swagpress:make --service --name=UserService
  npm run swagpress:make --model --name=Song

Options:
  --controller    Generate a new controller class
  --service       Generate a new service class
  --model         Generate a new model class
  --name=NAME     Specify the name of the class to generate
        `);
  }

  makeController(name) {
    const controllerName = this.ensureSuffix(name, "Controller");
    const serviceName = controllerName.replace("Controller", "Service");
    const modelName = controllerName.replace("Controller", "");

    const template = this.getControllerTemplate(
      controllerName,
      serviceName,
      modelName
    );
    let filePath = path.join(
      this.basePath,
      "app/controllers",
      `${controllerName}.js`
    );
    let finalControllerName = controllerName;

    this.ensureDirectoryExists(path.dirname(filePath));

    // If file exists, create a copy with suffix
    if (fs.existsSync(filePath)) {
      const { uniquePath, uniqueName } = this.getUniqueFilePath(
        filePath,
        controllerName
      );
      filePath = uniquePath;
      finalControllerName = uniqueName;
      console.log(
        `⚠️  Controller ${controllerName} already exists, creating ${finalControllerName} instead`
      );
    }

    // Update template with the final controller name
    const finalTemplate = template.replace(
      new RegExp(controllerName, "g"),
      finalControllerName
    );

    fs.writeFileSync(filePath, finalTemplate);
    console.log(
      `✅ Controller created: app/controllers/${finalControllerName}.js`
    );

    // Suggest next steps
    console.log(`
💡 Next steps:
   1. Create service: npm run swagpress:make --service --name=${serviceName}
   2. Update routes: Add routes in routes/api.js
   3. Generate docs: npm run swagpress:docs --generate
        `);
  }

  makeService(name) {
    const serviceName = this.ensureSuffix(name, "Service");
    const modelName = serviceName.replace("Service", "");

    const template = this.getServiceTemplate(serviceName, modelName);
    let filePath = path.join(
      this.basePath,
      "app/services",
      `${serviceName}.js`
    );
    let finalServiceName = serviceName;

    this.ensureDirectoryExists(path.dirname(filePath));

    // If file exists, create a copy with suffix
    if (fs.existsSync(filePath)) {
      const { uniquePath, uniqueName } = this.getUniqueFilePath(
        filePath,
        serviceName
      );
      filePath = uniquePath;
      finalServiceName = uniqueName;
      console.log(
        `⚠️  Service ${serviceName} already exists, creating ${finalServiceName} instead`
      );
    }

    // Update template with the final service name
    const finalTemplate = template.replace(
      new RegExp(serviceName, "g"),
      finalServiceName
    );

    fs.writeFileSync(filePath, finalTemplate);
    console.log(`✅ Service created: app/services/${finalServiceName}.js`);

    console.log(`
💡 Next steps:
   1. Implement business logic in ${serviceName}
   2. Create controller: npm run swagpress:make --controller --name=${modelName}Controller
        `);
  }

  makeModel(name) {
    const modelName = this.capitalize(name);

    const template = this.getModelTemplate(modelName);
    let filePath = path.join(this.basePath, "app/models", `${modelName}.js`);
    let finalModelName = modelName;

    this.ensureDirectoryExists(path.dirname(filePath));

    // If file exists, create a copy with suffix
    if (fs.existsSync(filePath)) {
      const { uniquePath, uniqueName } = this.getUniqueFilePath(
        filePath,
        modelName
      );
      filePath = uniquePath;
      finalModelName = uniqueName;
      console.log(
        `⚠️  Model ${modelName} already exists, creating ${finalModelName} instead`
      );
    }

    // Update template with the final model name
    const finalTemplate = template.replace(
      new RegExp(modelName, "g"),
      finalModelName
    );

    fs.writeFileSync(filePath, finalTemplate);
    console.log(`✅ Model created: app/models/${finalModelName}.js`);

    console.log(`
💡 Next steps:
   1. Define model fields and relationships in ${modelName}.js
   2. Create migration: npm run swagpress:make --migration --name=create_${name.toLowerCase()}s
   3. Create service: npm run swagpress:make --service --name=${modelName}Service
        `);
  }

  getControllerTemplate(controllerName, serviceName, modelName) {
    return `const ${serviceName} = require('../services/${serviceName}');
const ErrorHandler = require('../middleware/ErrorHandler');

class ${controllerName} {
    /**
     * GET /api/${modelName.toLowerCase()}s
     * @summary Get all ${modelName.toLowerCase()}s
     * @description Retrieve paginated list of ${modelName.toLowerCase()}s
     * @query {page?: number, limit?: number, search?: string}
     * @returns {${modelName.toLowerCase()}s: array, pagination: object}
     */
    static index = ErrorHandler.asyncHandler(async (req, res) => {
        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            search: req.query.search
        };
        
        const result = await ${serviceName}.getAll${modelName}s(options);
        
        res.json({
            code: 200,
            message: 'Get all ${modelName.toLowerCase()}s',
            data: result
        });
    });

    /**
     * GET /api/${modelName.toLowerCase()}s/:id
     * @summary Get ${modelName.toLowerCase()} by ID
     * @description Retrieve a specific ${modelName.toLowerCase()} by its ID
     * @param {id: string} path parameter
     * @returns {${modelName.toLowerCase()}: object}
     */
    static show = ErrorHandler.asyncHandler(async (req, res) => {
        const ${modelName.toLowerCase()} = await ${serviceName}.get${modelName}ById(req.params.id);
        
        res.json({
            code: 200,
            message: '${modelName} retrieved successfully',
            data: ${modelName.toLowerCase()}
        });
    });

    /**
     * POST /api/${modelName.toLowerCase()}s
     * @summary Create new ${modelName.toLowerCase()}
     * @description Create a new ${modelName.toLowerCase()} with provided data
     * @body {${modelName.toLowerCase()}Data: object}
     * @returns {${modelName.toLowerCase()}: object}
     */
    static store = ErrorHandler.asyncHandler(async (req, res) => {
        // Get user ID from auth middleware if needed
        const userId = req.user?.userId;
        
        const ${modelName.toLowerCase()} = await ${serviceName}.create${modelName}(req.body, userId);
        
        res.json({
            code: 201,
            message: '${modelName} created successfully',
            data: ${modelName.toLowerCase()}
        });
    });

    /**
     * PUT /api/${modelName.toLowerCase()}s/:id
     * @summary Update ${modelName.toLowerCase()}
     * @description Update an existing ${modelName.toLowerCase()} by ID
     * @param {id: string} path parameter
     * @body {${modelName.toLowerCase()}Data: object}
     * @returns {${modelName.toLowerCase()}: object}
     */
    static update = ErrorHandler.asyncHandler(async (req, res) => {
        const userId = req.user?.userId;
        
        const ${modelName.toLowerCase()} = await ${serviceName}.update${modelName}(req.params.id, req.body, userId);
        
        res.json({
            code: 200,
            message: '${modelName} updated successfully',
            data: ${modelName.toLowerCase()}
        });
    });

    /**
     * DELETE /api/${modelName.toLowerCase()}s/:id
     * @summary Delete ${modelName.toLowerCase()}
     * @description Delete a ${modelName.toLowerCase()} by ID
     * @param {id: string} path parameter
     * @returns {message: string}
     */
    static destroy = ErrorHandler.asyncHandler(async (req, res) => {
        const userId = req.user?.userId;
        
        const result = await ${serviceName}.delete${modelName}(req.params.id, userId);
        
        res.json({
            code: 200,
            message: result.message
        });
    });
}

module.exports = ${controllerName};`;
  }

  getServiceTemplate(serviceName, modelName) {
    return `const { Op } = require('sequelize');
const ${modelName} = require('../models/${modelName}');
const { ModelNotFoundException, ValidationException } = require('../../package/swagpress');

class ${serviceName} {
    /**
     * Get all ${modelName.toLowerCase()}s with pagination and filters
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Paginated ${modelName.toLowerCase()}s
     */
    static async getAll${modelName}s(options = {}) {
        try {
            const {
                page = 1,
                limit = 10,
                search,
                sortBy = 'createdAt',
                sortOrder = 'DESC'
            } = options;

            const offset = (page - 1) * limit;
            const where = {};

            // Add search filter
            if (search) {
                where[Op.or] = [
                    // Add searchable fields here
                    // { name: { [Op.like]: \`%\${search}%\` } },
                ];
            }

            const { count, rows } = await ${modelName}.findAndCountAll({
                where,
                limit: parseInt(limit),
                offset,
                order: [[sortBy, sortOrder]]
            });

            return {
                ${modelName.toLowerCase()}s: rows,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(count / limit),
                    totalItems: count,
                    itemsPerPage: parseInt(limit),
                    hasNextPage: page * limit < count,
                    hasPrevPage: page > 1
                }
            };
        } catch (error) {
            throw error; // Let middleware handle the error
        }
    }

    /**
     * Get ${modelName.toLowerCase()} by ID
     * @param {string} ${modelName.toLowerCase()}Id - ${modelName} ID
     * @returns {Promise<Object>} ${modelName} details
     */
    static async get${modelName}ById(${modelName.toLowerCase()}Id) {
        const ${modelName.toLowerCase()} = await ${modelName}.findByPk(${modelName.toLowerCase()}Id);

        if (!${modelName.toLowerCase()}) {
            throw new ModelNotFoundException('${modelName}', ${modelName.toLowerCase()}Id);
        }

        return ${modelName.toLowerCase()};
    }

    /**
     * Create a new ${modelName.toLowerCase()}
     * @param {Object} ${modelName.toLowerCase()}Data - ${modelName} creation data
     * @param {string} userId - User ID creating the ${modelName.toLowerCase()}
     * @returns {Promise<Object>} Created ${modelName.toLowerCase()}
     */
    static async create${modelName}(${modelName.toLowerCase()}Data, userId) {
        const ${modelName.toLowerCase()} = await ${modelName}.create({
            ...${modelName.toLowerCase()}Data,
            created_by: userId
        });

        return ${modelName.toLowerCase()};
    }

    /**
     * Update an existing ${modelName.toLowerCase()}
     * @param {string} ${modelName.toLowerCase()}Id - ${modelName} ID
     * @param {Object} updateData - Update data
     * @param {string} userId - User ID making the update
     * @returns {Promise<Object>} Updated ${modelName.toLowerCase()}
     */
    static async update${modelName}(${modelName.toLowerCase()}Id, updateData, userId) {
        const ${modelName.toLowerCase()} = await ${modelName}.findByPk(${modelName.toLowerCase()}Id);
        if (!${modelName.toLowerCase()}) {
            throw new ModelNotFoundException('${modelName}', ${modelName.toLowerCase()}Id);
        }

        // Add authorization logic here if needed
        // if (${modelName.toLowerCase()}.created_by !== userId) {
        //     throw new ForbiddenException('Unauthorized to update this ${modelName.toLowerCase()}');
        // }

        await ${modelName.toLowerCase()}.update(updateData);
        return ${modelName.toLowerCase()};
    }

    /**
     * Delete a ${modelName.toLowerCase()}
     * @param {string} ${modelName.toLowerCase()}Id - ${modelName} ID
     * @param {string} userId - User ID requesting deletion
     * @returns {Promise<Object>} Success message
     */
    static async delete${modelName}(${modelName.toLowerCase()}Id, userId) {
        const ${modelName.toLowerCase()} = await ${modelName}.findByPk(${modelName.toLowerCase()}Id);
        if (!${modelName.toLowerCase()}) {
            throw new ModelNotFoundException('${modelName}', ${modelName.toLowerCase()}Id);
        }

        // Add authorization logic here if needed
        // if (${modelName.toLowerCase()}.created_by !== userId) {
        //     throw new ForbiddenException('Unauthorized to delete this ${modelName.toLowerCase()}');
        // }

        await ${modelName.toLowerCase()}.destroy();

        return {
            message: '${modelName} deleted successfully'
        };
    }
}

module.exports = ${serviceName};`;
  }

  getModelTemplate(modelName) {
    return `const { BaseModel, ModelFactory } = require('../../package/src/engine');
const sequelize = require('../../config/database');

class ${modelName} extends BaseModel {
    static get fillable() {
        return [
            // Add fillable fields here
            // 'name',
            // 'description',
            // 'status'
        ];
    }

    static get hidden() {
        return [
            // Add fields to hide from JSON output
            // 'password',
            // 'secret_key'
        ];
    }

    static get casts() {
        return {
            // Add type casting here
            // 'is_active': 'boolean',
            // 'created_at': 'date'
        };
    }

    static associate(models) {
        // Define relationships here
        // this.belongsTo(models.User, {
        //     foreignKey: 'user_id',
        //     as: 'user'
        // });
        //
        // this.hasMany(models.Comment, {
        //     foreignKey: '${modelName.toLowerCase()}_id',
        //     as: 'comments'
        // });
    }

    // Instance methods
    // isActive() {
    //     return this.status === 'active';
    // }

    // Static methods
    // static async findActive() {
    //     return this.findAll({
    //         where: { status: 'active' }
    //     });
    // }
}

module.exports = ModelFactory.register(${modelName}, sequelize, {
    tableName: '${modelName.toLowerCase()}s'
});`;
  }

  ensureSuffix(name, suffix) {
    if (name.endsWith(suffix)) {
      return name;
    }
    return name + suffix;
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Generate unique file path if original exists
   * @param {string} originalPath - Original file path
   * @param {string} originalName - Original class name
   * @returns {Object} Object with uniquePath and uniqueName
   */
  getUniqueFilePath(originalPath, originalName) {
    const dir = path.dirname(originalPath);
    const ext = path.extname(originalPath);
    const baseName = path.basename(originalPath, ext);

    let counter = 1;
    let uniquePath;
    let uniqueName;

    do {
      const suffix = counter === 1 ? "Copy" : `Copy${counter}`;
      uniqueName = `${originalName}${suffix}`;
      const uniqueFileName = `${baseName}${suffix}${ext}`;
      uniquePath = path.join(dir, uniqueFileName);
      counter++;
    } while (fs.existsSync(uniquePath));

    return { uniquePath, uniqueName };
  }
}

// Run the command if this file is executed directly
if (require.main === module) {
  const command = new MakeCommand();
  command.execute();
}

module.exports = MakeCommand;
