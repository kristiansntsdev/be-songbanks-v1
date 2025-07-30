/**
 * Factory Engine - Laravel-inspired model factories for Node.js
 *
 * This module provides a complete factory system similar to Laravel's Eloquent factories,
 * including state management, relationships, and realistic test data generation.
 */

import Factory from "./Factory.js";
import FactoryTypes from "./FactoryTypes.js";
import {
  FactoryBuilder,
  factoryBuilder,
  define,
  factory,
  state,
  reset,
  loadFactories,
} from "./FactoryBuilder.js";
import {
  Relationship,
  HasOneRelationship,
  HasManyRelationship,
  BelongsToRelationship,
  BelongsToManyRelationship,
  MorphToRelationship,
  Sequence,
  CrossJoinSequence,
} from "./Relationships.js";
import path from "path";

/**
 * Auto-load factories from the project's database/factories directory
 */
function autoLoadFactories() {
  const projectRoot = path.resolve(process.cwd());
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

const exportObject = {
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
Object.assign(exportObject, FactoryTypes);

export default exportObject;
