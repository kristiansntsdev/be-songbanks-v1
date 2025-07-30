import { faker } from "@faker-js/faker";
import { ulid } from "ulid";

/**
 * Abstract Factory class - Laravel-inspired model factory for Node.js
 * Provides a fluent API for generating test data and model instances
 */
class Factory {
  constructor(options = {}) {
    this.count = options.count || null;
    this.states = options.states || [];
    this.has = options.has || [];
    this.for = options.for || [];
    this.afterMaking = options.afterMaking || [];
    this.afterCreating = options.afterCreating || [];
    this.connection = options.connection || null;
    this.recycle = options.recycle || new Map();
    this.expandRelationships = options.expandRelationships !== false;
    this.faker = faker;
  }

  /**
   * Define the model's default state - must be implemented by subclasses
   * @returns {Object} Default attributes for the model
   */
  definition() {
    throw new Error("definition() method must be implemented by subclass");
  }

  /**
   * Create a new factory instance
   * @param {Object|Function} attributes - Initial attributes or state function
   * @returns {Factory} New factory instance
   */
  static new(attributes = {}) {
    const factory = new this();
    return factory.state(attributes).configure();
  }

  /**
   * Create factory for specific count
   * @param {number} count - Number of models to generate
   * @returns {Factory} Factory instance with count set
   */
  static times(count) {
    return this.new().count(count);
  }

  /**
   * Configure the factory - can be overridden by subclasses
   * @returns {Factory} This factory instance
   */
  configure() {
    return this;
  }

  /**
   * Get raw attributes without creating model instances
   * @param {Object|Function} attributes - Override attributes
   * @param {Object} parent - Parent model instance
   * @returns {Object|Array} Raw attributes
   */
  raw(attributes = {}, parent = null) {
    if (this.count === null) {
      return this.state(attributes).getExpandedAttributes(parent);
    }

    return Array.from({ length: this.count }, () =>
      this.state(attributes).getExpandedAttributes(parent)
    );
  }

  /**
   * Create a single model instance
   * @param {Object|Function} attributes - Override attributes
   * @returns {Object} Single model instance
   */
  createOne(attributes = {}) {
    return this.count(null).create(attributes);
  }

  /**
   * Create multiple model instances
   * @param {number|Array} records - Number of records or array of attribute objects
   * @returns {Array} Array of model instances
   */
  createMany(records = null) {
    records = records || this.count || 1;
    this.count = null;

    if (typeof records === "number") {
      records = Array(records).fill({});
    }

    return records.map((record) => this.state(record).create());
  }

  /**
   * Create model instances and persist them
   * @param {Object|Function} attributes - Override attributes
   * @param {Object} parent - Parent model instance
   * @returns {Object|Array} Created model instances
   */
  async create(attributes = {}, parent = null) {
    if (Object.keys(attributes).length > 0) {
      return this.state(attributes).create({}, parent);
    }

    const results = await this.make(attributes, parent);

    if (Array.isArray(results)) {
      await this.store(results);
      this.callAfterCreating(results, parent);
    } else {
      await this.store([results]);
      this.callAfterCreating([results], parent);
    }

    return results;
  }

  /**
   * Create model instances without persisting
   * @param {Object|Function} attributes - Override attributes
   * @param {Object} parent - Parent model instance
   * @returns {Object|Array} Model instances (not persisted)
   */
  async make(attributes = {}, parent = null) {
    if (Object.keys(attributes).length > 0) {
      return this.state(attributes).make({}, parent);
    }

    if (this.count === null) {
      const instance = this.makeInstance(parent);
      this.callAfterMaking([instance]);
      return instance;
    }

    if (this.count < 1) {
      return [];
    }

    const instances = Array.from({ length: this.count }, () =>
      this.makeInstance(parent)
    );

    this.callAfterMaking(instances);
    return instances;
  }

  /**
   * Make a single instance without persisting
   * @param {Object|Function} attributes - Override attributes
   * @returns {Object} Single model instance
   */
  makeOne(attributes = {}) {
    return this.count(null).make(attributes);
  }

  /**
   * Create a single model instance
   * @param {Object} parent - Parent model instance
   * @returns {Object} Model instance
   */
  makeInstance(parent = null) {
    const attributes = this.getExpandedAttributes(parent);
    const model = this.newModel(attributes);

    if (this.connection) {
      model._connection = this.connection;
    }

    return model;
  }

  /**
   * Get expanded attributes with all states applied
   * @param {Object} parent - Parent model instance
   * @returns {Object} Expanded attributes
   */
  getExpandedAttributes(parent = null) {
    return this.expandAttributes(this.getRawAttributes(parent));
  }

  /**
   * Get raw attributes by applying all states
   * @param {Object} parent - Parent model instance
   * @returns {Object} Raw attributes
   */
  getRawAttributes(parent = null) {
    let attributes = this.definition();

    // Apply parent relationships first
    if (this.for.length > 0) {
      const parentResolvers = this.parentResolvers();
      attributes = { ...attributes, ...parentResolvers };
    }

    // Apply all states in sequence
    for (const state of this.states) {
      if (typeof state === "function") {
        const result = state.call(this, attributes, parent);
        attributes = { ...attributes, ...result };
      } else {
        attributes = { ...attributes, ...state };
      }
    }

    return attributes;
  }

  /**
   * Create parent relationship resolvers
   * @returns {Object} Parent relationship attributes
   */
  parentResolvers() {
    const resolvers = {};

    for (const relationship of this.for) {
      const parentAttributes = relationship.attributesFor(this.newModel());
      Object.assign(resolvers, parentAttributes);
    }

    return resolvers;
  }

  /**
   * Expand attributes by resolving functions and relationships
   * @param {Object} definition - Raw attribute definition
   * @returns {Object} Expanded attributes
   */
  expandAttributes(definition) {
    const expanded = {};

    for (const [key, value] of Object.entries(definition)) {
      let expandedValue = value;

      // Handle factory instances
      if (value instanceof Factory) {
        if (!this.expandRelationships) {
          expandedValue = null;
        } else {
          const recycled = this.getRandomRecycledModel(value.modelName());
          expandedValue = recycled
            ? recycled.id
            : value.recycle(this.recycle).create().id;
        }
      }
      // Handle model instances
      else if (value && typeof value === "object" && value.id) {
        expandedValue = value.id;
      }
      // Handle functions
      else if (typeof value === "function") {
        expandedValue = value.call(this, definition);

        // Re-evaluate if function returned a factory or model
        if (expandedValue instanceof Factory) {
          expandedValue = this.expandRelationships
            ? expandedValue.create().id
            : null;
        } else if (
          expandedValue &&
          typeof expandedValue === "object" &&
          expandedValue.id
        ) {
          expandedValue = expandedValue.id;
        }
      }

      expanded[key] = expandedValue;
    }

    return expanded;
  }

  /**
   * Add state transformation
   * @param {Object|Function} state - State attributes or function
   * @returns {Factory} New factory instance with state
   */
  state(state) {
    const stateFunction = typeof state === "function" ? state : () => state;

    return this.newInstance({
      states: [...this.states, stateFunction],
    });
  }

  /**
   * Set a single attribute
   * @param {string} key - Attribute key
   * @param {*} value - Attribute value
   * @returns {Factory} New factory instance
   */
  set(key, value) {
    return this.state({ [key]: value });
  }

  /**
   * Add sequence state transformation
   * @param {...*} sequence - Sequence values
   * @returns {Factory} New factory instance
   */
  sequence(...sequence) {
    let index = 0;
    return this.state(() => {
      const value = sequence[index % sequence.length];
      index++;
      return typeof value === "function" ? value() : value;
    });
  }

  /**
   * Define child relationship
   * @param {Factory} factory - Related factory
   * @param {string} relationship - Relationship name
   * @returns {Factory} New factory instance
   */
  has(factory, relationship = null) {
    const relationshipName =
      relationship || this.guessRelationship(factory.modelName());

    return this.newInstance({
      has: [...this.has, { factory, relationship: relationshipName }],
    });
  }

  /**
   * Define many-to-many relationship
   * @param {Factory} factory - Related factory
   * @param {Object|Function} pivot - Pivot table attributes
   * @param {string} relationship - Relationship name
   * @returns {Factory} New factory instance
   */
  hasAttached(factory, pivot = {}, relationship = null) {
    const relationshipName =
      relationship || this.guessRelationship(factory.modelName(), true);

    return this.newInstance({
      has: [
        ...this.has,
        {
          factory,
          relationship: relationshipName,
          pivot,
          type: "belongsToMany",
        },
      ],
    });
  }

  /**
   * Define parent relationship
   * @param {Factory} factory - Parent factory
   * @param {string} relationship - Relationship name
   * @returns {Factory} New factory instance
   */
  for(factory, relationship = null) {
    const relationshipName =
      relationship || this.guessRelationship(factory.modelName());

    return this.newInstance({
      for: [...this.for, { factory, relationship: relationshipName }],
    });
  }

  /**
   * Provide models to recycle instead of creating new ones
   * @param {Object|Array} models - Models to recycle
   * @returns {Factory} New factory instance
   */
  recycle(models) {
    const modelsArray = Array.isArray(models) ? models : [models];
    const newRecycle = new Map(this.recycle);

    for (const model of modelsArray) {
      const modelName = model.constructor.name;
      if (!newRecycle.has(modelName)) {
        newRecycle.set(modelName, []);
      }
      newRecycle.get(modelName).push(model);
    }

    return this.newInstance({ recycle: newRecycle });
  }

  /**
   * Get random recycled model
   * @param {string} modelName - Model class name
   * @returns {Object|null} Random recycled model
   */
  getRandomRecycledModel(modelName) {
    const models = this.recycle.get(modelName);
    if (!models || models.length === 0) return null;
    return models[Math.floor(Math.random() * models.length)];
  }

  /**
   * Add after making callback
   * @param {Function} callback - Callback function
   * @returns {Factory} New factory instance
   */
  afterMaking(callback) {
    return this.newInstance({
      afterMaking: [...this.afterMaking, callback],
    });
  }

  /**
   * Add after creating callback
   * @param {Function} callback - Callback function
   * @returns {Factory} New factory instance
   */
  afterCreating(callback) {
    return this.newInstance({
      afterCreating: [...this.afterCreating, callback],
    });
  }

  /**
   * Set the count of models to generate
   * @param {number} count - Number of models
   * @returns {Factory} New factory instance
   */
  count(count) {
    return this.newInstance({ count });
  }

  /**
   * Disable relationship expansion
   * @returns {Factory} New factory instance
   */
  withoutParents() {
    return this.newInstance({ expandRelationships: false });
  }

  /**
   * Set database connection
   * @param {string} connection - Connection name
   * @returns {Factory} New factory instance
   */
  connection(connection) {
    return this.newInstance({ connection });
  }

  /**
   * Create new factory instance with modified properties
   * @param {Object} overrides - Properties to override
   * @returns {Factory} New factory instance
   */
  newInstance(overrides = {}) {
    return new this.constructor({
      count: this.count,
      states: this.states,
      has: this.has,
      for: this.for,
      afterMaking: this.afterMaking,
      afterCreating: this.afterCreating,
      connection: this.connection,
      recycle: this.recycle,
      expandRelationships: this.expandRelationships,
      ...overrides,
    });
  }

  /**
   * Create new model instance
   * @param {Object} attributes - Model attributes
   * @returns {Object} New model instance
   */
  newModel(attributes = {}) {
    const ModelClass = this.getModelClass();
    return new ModelClass(attributes);
  }

  /**
   * Get the model class for this factory
   * @returns {Function} Model class constructor
   */
  getModelClass() {
    if (this.model) {
      return this.model;
    }

    // Auto-resolve model class from factory name
    const factoryName = this.constructor.name;
    const modelName = factoryName.replace("Factory", "");

    try {
      return require(`../../models/${modelName}`);
    } catch (error) {
      throw new Error(
        `Could not resolve model class for factory ${factoryName}. Please set the 'model' property.`
      );
    }
  }

  /**
   * Get model name
   * @returns {string} Model class name
   */
  modelName() {
    return this.getModelClass().name;
  }

  /**
   * Guess relationship name from model name
   * @param {string} modelName - Related model name
   * @param {boolean} plural - Whether to pluralize
   * @returns {string} Relationship name
   */
  guessRelationship(modelName, plural = false) {
    const baseName = modelName.toLowerCase();
    return plural ? this.pluralize(baseName) : baseName;
  }

  /**
   * Simple pluralization
   * @param {string} word - Word to pluralize
   * @returns {string} Pluralized word
   */
  pluralize(word) {
    if (word.endsWith("s")) return word;
    if (word.endsWith("y")) return word.slice(0, -1) + "ies";
    return word + "s";
  }

  /**
   * Store models to database
   * @param {Array} models - Models to store
   */
  async store(models) {
    for (const model of models) {
      if (typeof model.save === "function") {
        await model.save();
      }
      await this.createChildren(model);
    }
  }

  /**
   * Create child relationships
   * @param {Object} model - Parent model
   */
  async createChildren(model) {
    for (const relationship of this.has) {
      const {
        factory,
        relationship: relationshipName,
        pivot,
        type,
      } = relationship;

      if (type === "belongsToMany") {
        // Handle many-to-many relationships
        const children = await factory.recycle(this.recycle).createMany();
        // Attach children with pivot data if needed
        if (typeof model.attach === "function") {
          await model.attach(relationshipName, children, pivot);
        }
      } else {
        // Handle has-many relationships
        const children = await factory
          .recycle(this.recycle)
          .for(model)
          .createMany();
      }
    }
  }

  /**
   * Call after making callbacks
   * @param {Array} instances - Model instances
   */
  callAfterMaking(instances) {
    for (const instance of instances) {
      for (const callback of this.afterMaking) {
        callback(instance);
      }
    }
  }

  /**
   * Call after creating callbacks
   * @param {Array} instances - Model instances
   * @param {Object} parent - Parent model
   */
  callAfterCreating(instances, parent = null) {
    for (const instance of instances) {
      for (const callback of this.afterCreating) {
        callback(instance, parent);
      }
    }
  }

  /**
   * Create factory for specific model
   * @param {string} modelName - Model class name
   * @returns {Factory} Factory instance
   */
  static factoryForModel(modelName) {
    const FactoryClass = this.resolveFactoryName(modelName);
    return FactoryClass.new();
  }

  /**
   * Resolve factory class name from model name
   * @param {string} modelName - Model class name
   * @returns {Function} Factory class
   */
  static resolveFactoryName(modelName) {
    const factoryName = `${modelName}Factory`;
    try {
      return require(`../factories/${factoryName}`);
    } catch (error) {
      throw new Error(
        `Could not find factory ${factoryName} for model ${modelName}`
      );
    }
  }
}

export default Factory;
