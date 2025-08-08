import { DataTypes } from "sequelize";
import { ulid } from "ulid";

/**
 * ModelFactory - Automatic model initialization
 *
 * Eliminates the need for verbose User.init() calls by automatically
 * detecting and setting up models based on migrations and conventions.
 */
class ModelFactory {
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
   * Auto-detect schema based on model name and conventions
   * @param {string} modelName - Name of the model
   * @returns {Object} Schema definition
   */
  static autoDetectSchema(modelName) {
    // Base schema that all models get
    const baseSchema = {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
    };

    // Model-specific schemas based on conventions
    const schemas = {
      User: {
        ...baseSchema,
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        password: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        role: {
          type: DataTypes.ENUM("admin", "member", "guest"),
          allowNull: false,
          defaultValue: "guest",
        },
        status: {
          type: DataTypes.ENUM("active", "pending", "request", "suspend"),
          allowNull: false,
          defaultValue: "pending",
        },
      },

      Song: {
        ...baseSchema,
        title: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        artist: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        base_chord: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        lyrics_and_chords: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },

      Note: {
        ...baseSchema,
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "users",
            key: "id",
          },
        },
        song_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "songs",
            key: "id",
          },
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },

      Tag: {
        ...baseSchema,
        name: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
    };

    return schemas[modelName] || baseSchema;
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
