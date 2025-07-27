/**
 * Factory Engine - Laravel-inspired model factories for Node.js
 *
 * This module provides a complete factory system similar to Laravel's Eloquent factories,
 * including state management, relationships, and realistic test data generation.
 */

const Factory = require("./Factory");
const FactoryTypes = require("./FactoryTypes");
const {
  FactoryBuilder,
  factoryBuilder,
  define,
  factory,
  state,
  reset,
  loadFactories,
} = require("./FactoryBuilder");
const {
  Relationship,
  HasOneRelationship,
  HasManyRelationship,
  BelongsToRelationship,
  BelongsToManyRelationship,
  MorphToRelationship,
  Sequence,
  CrossJoinSequence,
} = require("./Relationships");

/**
 * Auto-load factories from the project's database/factories directory
 */
function autoLoadFactories() {
  const path = require("path");
  const projectRoot = path.resolve(__dirname, "../../../..");
  const factoriesDir = path.join(projectRoot, "database", "factories");

  try {
    loadFactories(factoriesDir);
  } catch (error) {
    // Factories directory doesn't exist or can't be loaded
    // This is okay - not all projects will have factories
  }
}

// Auto-load on module import
autoLoadFactories();

module.exports = {
  // Core classes
  Factory,
  FactoryTypes,
  FactoryBuilder,

  // Relationship classes
  Relationship,
  HasOneRelationship,
  HasManyRelationship,
  BelongsToRelationship,
  BelongsToManyRelationship,
  MorphToRelationship,

  // Utility classes
  Sequence,
  CrossJoinSequence,

  // Singleton instance and convenience methods
  factoryBuilder,
  define,
  factory,
  state,
  reset,
  loadFactories,

  // Aliases for convenience (Laravel-style)
  create: (modelName, attributes, count) => {
    const f = factory(modelName, count);
    return f.create(attributes);
  },

  make: (modelName, attributes, count) => {
    const f = factory(modelName, count);
    return f.make(attributes);
  },

  raw: (modelName, attributes, count) => {
    const f = factory(modelName, count);
    return f.raw(attributes);
  },

  // Helper to create factories with fluent API
  factoryFor: (modelName) => factory(modelName),

  // State helpers
  sequence: (...values) => new Sequence(...values),
  crossJoin: (...sequences) => new CrossJoinSequence(...sequences),
};

// Re-export FactoryTypes methods for convenience
Object.assign(module.exports, FactoryTypes);
