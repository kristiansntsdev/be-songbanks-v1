import fs from "fs";
import path from "path";
import { DataTypes } from "sequelize";

/**
 * SchemaDetector - Dynamically detects model schemas from fillable arrays and migrations
 */
class SchemaDetector {
  constructor() {
    this.modelsPath = path.resolve(process.cwd(), "app/models");
    this.migrationsPath = path.resolve(process.cwd(), "database/migrations");
    this.schemaCache = new Map();
  }

  /**
   * Parse migration file to extract table schema
   * @param {string} migrationPath
   * @returns {Object} Table schema with field definitions
   */
  parseMigrationFile(migrationPath) {
    try {
      const content = fs.readFileSync(migrationPath, "utf8");

      // Extract table name from createTable call
      const tableNameMatch = content.match(
        /createTable\s*\(\s*["']([^"']+)["']/
      );
      if (!tableNameMatch) return null;

      const tableName = tableNameMatch[1];

      // Extract fields from the createTable structure
      const createTableMatch = content.match(
        /createTable\s*\([^,]+,\s*\{([\s\S]*?)\}\s*\)/
      );
      if (!createTableMatch) return null;

      const fieldsContent = createTableMatch[1];
      const schema = this.parseFieldDefinitions(fieldsContent);

      return { tableName, schema };
    } catch (error) {
      console.warn(
        `Failed to parse migration file ${migrationPath}:`,
        error.message
      );
      return null;
    }
  }

  /**
   * Parse field definitions from migration content
   * @param {string} fieldsContent
   * @returns {Object} Field schema definitions
   */
  parseFieldDefinitions(fieldsContent) {
    const schema = {};

    // Split by field definitions (looking for field_name: {})
    const fieldMatches = fieldsContent.match(/(\w+):\s*\{[^}]*\}/g);

    if (!fieldMatches) return schema;

    fieldMatches.forEach((fieldMatch) => {
      const fieldNameMatch = fieldMatch.match(/^(\w+):/);
      if (!fieldNameMatch) return;

      const fieldName = fieldNameMatch[1];
      const fieldDef = this.parseFieldDefinition(fieldMatch);

      if (fieldDef) {
        schema[fieldName] = fieldDef;
      }
    });

    return schema;
  }

  /**
   * Parse individual field definition
   * @param {string} fieldContent
   * @returns {Object} Sequelize field definition
   */
  parseFieldDefinition(fieldContent) {
    const definition = {};

    // Extract type
    const typeMatch = fieldContent.match(
      /type:\s*Sequelize\.(\w+)(?:\(([^)]+)\))?/
    );
    if (typeMatch) {
      const sequelizeType = typeMatch[1];
      const typeParam = typeMatch[2];

      // Map Sequelize types to DataTypes
      const typeMap = {
        STRING:
          typeParam && !isNaN(parseInt(typeParam))
            ? DataTypes.STRING(parseInt(typeParam))
            : DataTypes.STRING,
        TEXT: DataTypes.TEXT,
        INTEGER: DataTypes.INTEGER,
        BIGINT: DataTypes.BIGINT,
        FLOAT: DataTypes.FLOAT,
        DOUBLE: DataTypes.DOUBLE,
        DECIMAL: DataTypes.DECIMAL,
        DATE: DataTypes.DATE,
        BOOLEAN: DataTypes.BOOLEAN,
        ENUM: DataTypes.ENUM,
        JSON: DataTypes.JSON,
        UUID: DataTypes.UUID,
      };

      definition.type = typeMap[sequelizeType] || DataTypes.STRING;
    }

    // Extract allowNull
    const allowNullMatch = fieldContent.match(/allowNull:\s*(true|false)/);
    if (allowNullMatch) {
      definition.allowNull = allowNullMatch[1] === "true";
    }

    // Extract primaryKey
    if (fieldContent.includes("primaryKey: true")) {
      definition.primaryKey = true;
    }

    // Extract autoIncrement
    if (fieldContent.includes("autoIncrement: true")) {
      definition.autoIncrement = true;
    }

    // Extract defaultValue
    const defaultMatch = fieldContent.match(/defaultValue:\s*([^,}]+)/);
    if (defaultMatch) {
      let defaultValue = defaultMatch[1].trim();
      if (defaultValue === "true") defaultValue = true;
      else if (defaultValue === "false") defaultValue = false;
      else if (!isNaN(defaultValue)) defaultValue = Number(defaultValue);
      else if (defaultValue.startsWith('"') || defaultValue.startsWith("'")) {
        defaultValue = defaultValue.slice(1, -1);
      }

      definition.defaultValue = defaultValue;
    }

    // Extract unique
    if (fieldContent.includes("unique: true")) {
      definition.unique = true;
    }

    return definition;
  }

  /**
   * Parse model file to extract fillable array
   * @param {string} modelPath
   * @returns {Object} Model info with fillable fields
   */
  parseModelFile(modelPath) {
    try {
      const content = fs.readFileSync(modelPath, "utf8");

      // Extract class name
      const classMatch = content.match(/class\s+(\w+)\s+extends/);
      if (!classMatch) return null;

      const modelName = classMatch[1];

      // Extract fillable array
      const fillableMatch = content.match(
        /static\s+get\s+fillable\s*\(\s*\)\s*\{[\s\S]*?return\s*\[([\s\S]*?)\]/
      );

      let fillable = [];
      if (fillableMatch) {
        const fillableContent = fillableMatch[1];
        // Extract field names from the array (handle quoted strings)
        const fieldMatches = fillableContent.match(/"([^"]+)"|'([^']+)'/g);
        if (fieldMatches) {
          fillable = fieldMatches.map((match) => match.slice(1, -1));
        }
      }

      // Extract table name from ModelFactory.register call
      const registerMatch = content.match(
        /ModelFactory\.register\([^,]+,\s*[^,]+,\s*\{[^}]*tableName:\s*["']([^"']+)["']/
      );
      const tableName = registerMatch
        ? registerMatch[1]
        : modelName.toLowerCase() + "s";

      return { modelName, tableName, fillable };
    } catch (error) {
      console.warn(`Failed to parse model file ${modelPath}:`, error.message);
      return null;
    }
  }

  /**
   * Get all migration files sorted by timestamp
   * @returns {Array} Array of migration file paths
   */
  getMigrationFiles() {
    try {
      const files = fs.readdirSync(this.migrationsPath);
      return files
        .filter((file) => file.endsWith(".js"))
        .sort()
        .map((file) => path.join(this.migrationsPath, file));
    } catch (error) {
      console.warn(`Failed to read migrations directory:`, error.message);
      return [];
    }
  }

  /**
   * Get all model files
   * @returns {Array} Array of model file paths
   */
  getModelFiles() {
    try {
      const files = fs.readdirSync(this.modelsPath);
      return files
        .filter((file) => file.endsWith(".js") && file !== "index.js")
        .map((file) => path.join(this.modelsPath, file));
    } catch (error) {
      console.warn(`Failed to read models directory:`, error.message);
      return [];
    }
  }

  /**
   * Build complete schema for a model by combining migration and fillable data
   * @param {string} modelName
   * @returns {Object} Complete schema definition
   */
  buildSchemaForModel(modelName) {
    if (this.schemaCache.has(modelName)) {
      return this.schemaCache.get(modelName);
    }

    // Parse all migrations to build table schemas
    const migrationFiles = this.getMigrationFiles();
    const tableSchemas = new Map();

    migrationFiles.forEach((migrationPath) => {
      const migrationData = this.parseMigrationFile(migrationPath);
      if (migrationData) {
        tableSchemas.set(migrationData.tableName, migrationData.schema);
      }
    });

    // Parse all models to get fillable arrays
    const modelFiles = this.getModelFiles();
    const modelData = new Map();

    modelFiles.forEach((modelPath) => {
      const modelInfo = this.parseModelFile(modelPath);
      if (modelInfo) {
        modelData.set(modelInfo.modelName, modelInfo);
      }
    });

    // Find the specific model
    const targetModel = modelData.get(modelName);
    if (!targetModel) {
      console.warn(`Model ${modelName} not found`);
      return {};
    }

    // Find the corresponding table schema
    const tableSchema = tableSchemas.get(targetModel.tableName);
    if (!tableSchema) {
      console.warn(`Table schema for ${targetModel.tableName} not found`);
      return {};
    }

    // Build final schema by filtering table schema with fillable fields
    const finalSchema = {};

    // Always include id field
    if (tableSchema.id) {
      finalSchema.id = tableSchema.id;
    }

    // Include fillable fields
    targetModel.fillable.forEach((fieldName) => {
      if (tableSchema[fieldName]) {
        finalSchema[fieldName] = tableSchema[fieldName];
      } else {
        // Field in fillable but not in migration - create a default definition
        console.warn(
          `Field '${fieldName}' in fillable array but not found in migration for ${modelName}. Using default definition.`
        );
        finalSchema[fieldName] = {
          type: DataTypes.STRING,
          allowNull: true,
        };
      }
    });

    // Always include timestamps if they exist
    if (tableSchema.createdAt) {
      finalSchema.createdAt = tableSchema.createdAt;
    }
    if (tableSchema.updatedAt) {
      finalSchema.updatedAt = tableSchema.updatedAt;
    }

    this.schemaCache.set(modelName, finalSchema);
    return finalSchema;
  }

  /**
   * Clear the schema cache
   */
  clearCache() {
    this.schemaCache.clear();
  }
}

export default SchemaDetector;
