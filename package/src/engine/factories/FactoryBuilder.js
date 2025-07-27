const Factory = require("./Factory");
const FactoryTypes = require("./FactoryTypes");

/**
 * FactoryBuilder - Registry and builder for model factories
 * Provides a Laravel-like static API for factory management
 */
class FactoryBuilder {
  constructor() {
    this.factories = new Map();
    this.modelResolvers = new Map();
    this.factoryNamespace = "database/factories/";
  }

  /**
   * Define a new factory
   * @param {string} modelName - Name of the model
   * @param {Object|Function} definition - Factory definition
   * @returns {Function} Factory class
   */
  define(modelName, definition) {
    const factoryClass = class extends Factory {
      definition() {
        if (typeof definition === "function") {
          return definition.call(this);
        }

        // Resolve any FactoryTypes calls in the definition
        const resolved = {};
        for (const [key, value] of Object.entries(definition)) {
          if (
            typeof value === "function" &&
            value.name &&
            FactoryTypes[value.name]
          ) {
            // This is likely a FactoryTypes method, call it
            resolved[key] = value();
          } else {
            resolved[key] = value;
          }
        }
        return resolved;
      }
    };

    // Set the model name on the factory class
    factoryClass.modelName = modelName;

    // Register the factory
    this.factories.set(modelName, factoryClass);

    return factoryClass;
  }

  /**
   * Get a factory instance for a model
   * @param {string} modelName - Name of the model
   * @returns {Factory} Factory instance
   */
  get(modelName) {
    const FactoryClass = this.factories.get(modelName);
    if (!FactoryClass) {
      throw new Error(`No factory defined for model ${modelName}`);
    }
    return FactoryClass.new();
  }

  /**
   * Create factory instances
   * @param {string} modelName - Name of the model
   * @param {number} count - Number of instances (optional)
   * @returns {Factory} Factory instance
   */
  factory(modelName, count = null) {
    const factory = this.get(modelName);
    return count ? factory.count(count) : factory;
  }

  /**
   * Register a model resolver
   * @param {string} modelName - Name of the model
   * @param {Function} resolver - Function that returns the model class
   */
  registerModelResolver(modelName, resolver) {
    this.modelResolvers.set(modelName, resolver);
  }

  /**
   * Resolve a model class
   * @param {string} modelName - Name of the model
   * @returns {Function} Model class
   */
  resolveModel(modelName) {
    const resolver = this.modelResolvers.get(modelName);
    if (resolver) {
      return resolver();
    }

    // Try to auto-resolve from app/models directory
    try {
      return require(`../../../app/models/${modelName}`);
    } catch (error) {
      throw new Error(
        `Could not resolve model ${modelName}. Register a resolver or ensure the model exists at app/models/${modelName}.js`
      );
    }
  }

  /**
   * Set the factory namespace
   * @param {string} namespace - Namespace for factories
   */
  setNamespace(namespace) {
    this.factoryNamespace = namespace;
  }

  /**
   * Load all factories from a directory
   * @param {string} directory - Directory containing factory files
   */
  loadFactories(directory) {
    const fs = require("fs");
    const path = require("path");

    if (!fs.existsSync(directory)) {
      return;
    }

    const files = fs.readdirSync(directory);
    for (const file of files) {
      if (file.endsWith(".js") && file !== "index.js") {
        try {
          const factoryPath = path.join(directory, file);
          const factory = require(factoryPath);

          // Auto-register if factory exports a class with modelName
          if (factory.modelName) {
            this.factories.set(factory.modelName, factory);
          }
        } catch (error) {
          console.warn(`Failed to load factory from ${file}:`, error.message);
        }
      }
    }
  }

  /**
   * Create a state for a factory
   * @param {string} modelName - Name of the model
   * @param {string} stateName - Name of the state
   * @param {Object|Function} stateDefinition - State attributes
   */
  state(modelName, stateName, stateDefinition) {
    const FactoryClass = this.factories.get(modelName);
    if (!FactoryClass) {
      throw new Error(`No factory defined for model ${modelName}`);
    }

    // Add state method to the factory class
    FactoryClass[stateName] = function (attributes = {}) {
      return this.new().state({ ...stateDefinition, ...attributes });
    };
  }

  /**
   * Reset all factories
   */
  reset() {
    this.factories.clear();
    this.modelResolvers.clear();
  }

  /**
   * Get all registered factories
   * @returns {Map} Map of factory names to factory classes
   */
  getFactories() {
    return new Map(this.factories);
  }

  /**
   * Check if a factory is registered
   * @param {string} modelName - Name of the model
   * @returns {boolean} Whether the factory is registered
   */
  hasFactory(modelName) {
    return this.factories.has(modelName);
  }
}

// Singleton instance
const factoryBuilder = new FactoryBuilder();

// Export both the class and singleton instance
module.exports = {
  FactoryBuilder,
  factoryBuilder,

  // Convenience methods that delegate to the singleton
  define: (modelName, definition) =>
    factoryBuilder.define(modelName, definition),
  factory: (modelName, count) => factoryBuilder.factory(modelName, count),
  state: (modelName, stateName, definition) =>
    factoryBuilder.state(modelName, stateName, definition),
  reset: () => factoryBuilder.reset(),
  loadFactories: (directory) => factoryBuilder.loadFactories(directory),
};
