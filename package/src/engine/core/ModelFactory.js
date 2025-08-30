import { DataTypes } from "sequelize";
import { ulid } from "ulid";
import SchemaDetector from "../utils/SchemaDetector.js";

/**
 * ModelFactory - Automatic model initialization
 *
 * Eliminates the need for verbose User.init() calls by automatically
 * detecting and setting up models based on migrations and conventions.
 */
class ModelFactory {
  static schemaDetector = new SchemaDetector();
  /**
   * Register a model with automatic schema detection
   * @param {Function} ModelClass - The model class
   * @param {Object} sequelize - Sequelize instance
   * @param {Object} options - Additional options
   */
  static register(ModelClass, sequelize, options = {}) {
    const modelName = ModelClass.name;
    const tableName = options.tableName || modelName.toLowerCase() + "s";

    // Get schema from model's static schema property or auto-detect
    const schema =
      Object.prototype.hasOwnProperty.call(ModelClass, "schema") &&
      typeof ModelClass.schema === "object"
        ? ModelClass.schema
        : this.autoDetectSchema(modelName);

    ModelClass.init(schema, {
      sequelize,
      modelName,
      tableName,
      timestamps: true,
      underscored: false, // SQLite compatibility
      ...options,
    });

    return ModelClass;
  }

  /**
   * Auto-detect schema based on model name using dynamic detection
   * @param {string} modelName - Name of the model
   * @returns {Object} Schema definition
   */
  static autoDetectSchema(modelName) {
    try {
      const dynamicSchema = this.schemaDetector.buildSchemaForModel(modelName);

      // If dynamic detection found a schema, use it
      if (Object.keys(dynamicSchema).length > 0) {
        return dynamicSchema;
      }

      // Fallback to base schema if no dynamic schema found
      console.warn(`Using fallback base schema for model: ${modelName}`);
      return {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
      };
    } catch (error) {
      console.error(`Error detecting schema for ${modelName}:`, error.message);

      // Fallback to base schema on error
      return {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
      };
    }
  }

  /**
   * Bulk register multiple models
   * @param {Array} models - Array of {ModelClass, options} objects
   * @param {Object} sequelize - Sequelize instance
   */
  static registerAll(models, sequelize) {
    models.forEach(({ ModelClass, options = {} }) => {
      this.register(ModelClass, sequelize, options);
    });
  }

  /**
   * Create a simple model registration helper
   * @param {Object} sequelize - Sequelize instance
   * @returns {Function} Registration function
   */
  static createRegistrar(sequelize) {
    return (ModelClass, options = {}) => {
      return this.register(ModelClass, sequelize, options);
    };
  }
}

export default ModelFactory;
