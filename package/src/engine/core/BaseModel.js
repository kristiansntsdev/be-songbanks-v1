import { Sequelize, Model, DataTypes } from "sequelize";
import { ulid } from "ulid";

// Import concerns/traits
import HasAttributes from "./concerns/HasAttributes.js";
import GuardsAttributes from "./concerns/GuardsAttributes.js";
import HidesAttributes from "./concerns/HidesAttributes.js";
import HasTimestamps from "./concerns/HasTimestamps.js";
import HasEvents from "./concerns/HasEvents.js";

/**
 * Laravel Eloquent-inspired Sequelize Model abstraction
 *
 * Provides a Laravel-like model structure with concerns, lifecycle hooks,
 * and familiar Eloquent patterns for JavaScript/Node.js applications.
 */
class BaseModel extends Model {
  /**
   * The connection name for the model.
   * @type {string|null}
   */
  connection = null;

  /**
   * The table associated with the model.
   * @type {string|null}
   */
  table = null;

  /**
   * The primary key for the model.
   * @type {string}
   */
  primaryKey = "id";

  /**
   * The "type" of the primary key ID.
   * @type {string}
   */
  keyType = "string";

  /**
   * Indicates if the IDs are auto-incrementing.
   * @type {boolean}
   */
  incrementing = false;

  /**
   * The relations to eager load on every query.
   * @type {Array}
   */
  with = [];

  /**
   * Indicates if the model exists.
   * @type {boolean}
   */
  exists = false;

  /**
   * Indicates if the model was inserted during the object's lifecycle.
   * @type {boolean}
   */
  wasRecentlyCreated = false;

  /**
   * The array of booted models.
   * @type {Array}
   */
  static booted = [];

  /**
   * The array of trait initializers that will be called on each new instance.
   * @type {Object}
   */
  static traitInitializers = {};

  /**
   * The name of the "created at" column.
   * @type {string|null}
   */
  static CREATED_AT = "created_at";

  /**
   * The name of the "updated at" column.
   * @type {string|null}
   */
  static UPDATED_AT = "updated_at";

  /**
   * Create a new Eloquent model instance.
   * @param {Object} attributes
   */
  constructor(attributes = {}) {
    super(attributes);

    this.bootIfNotBooted();
    this.initializeTraits();
    this.syncOriginal();
  }

  /**
   * Check if the model needs to be booted and if so, do it.
   */
  bootIfNotBooted() {
    const className = this.constructor.name;

    if (!BaseModel.booted.includes(className)) {
      BaseModel.booted.push(className);

      this.fireModelEvent("booting", false);

      if (typeof this.constructor.booting === "function") {
        this.constructor.booting();
      }
      if (typeof this.constructor.boot === "function") {
        this.constructor.boot();
      }
      if (typeof this.constructor.afterBoot === "function") {
        this.constructor.afterBoot();
      }

      this.fireModelEvent("booted", false);
    }
  }

  /**
   * Perform any actions required before the model boots.
   */
  static booting() {
    // Override in child classes
  }

  /**
   * Bootstrap the model and its traits.
   */
  static boot() {
    this.bootTraits();
  }

  /**
   * Boot all of the bootable traits on the model.
   */
  static bootTraits() {
    const className = this.name;
    const traits = this.getTraits();

    BaseModel.traitInitializers[className] = [];

    traits.forEach((trait) => {
      const bootMethod = `boot${trait.name}`;
      const initializeMethod = `initialize${trait.name}`;

      // Call boot method if exists
      if (typeof this[bootMethod] === "function") {
        this[bootMethod]();
      }

      // Register initialize method if exists
      if (typeof this.prototype[initializeMethod] === "function") {
        if (
          !BaseModel.traitInitializers[className].includes(initializeMethod)
        ) {
          BaseModel.traitInitializers[className].push(initializeMethod);
        }
      }
    });
  }

  /**
   * Initialize any initializable traits on the model.
   */
  initializeTraits() {
    const className = this.constructor.name;
    const initializers = BaseModel.traitInitializers[className] || [];

    initializers.forEach((method) => {
      if (typeof this[method] === "function") {
        this[method]();
      }
    });
  }

  /**
   * Perform any actions required after the model boots.
   */
  static afterBoot() {
    // Override in child classes
  }

  /**
   * Clear the list of booted models so they will be re-booted.
   */
  static clearBootedModels() {
    BaseModel.booted = [];
  }

  /**
   * Get the traits used by this model.
   * @returns {Array}
   */
  static getTraits() {
    return [
      HasAttributes,
      GuardsAttributes,
      HidesAttributes,
      HasTimestamps,
      HasEvents,
    ];
  }

  /**
   * Get fillable attributes - MUST be implemented by child classes
   * @returns {Array}
   */
  static get fillable() {
    return [];
  }

  /**
   * Get hidden attributes (excluded from JSON serialization)
   * @returns {Array}
   */
  static get hidden() {
    return [];
  }

  /**
   * Get attribute casts
   * @returns {Object}
   */
  static get casts() {
    return {};
  }

  /**
   * Initialize the model with enhanced configuration
   */
  static init(attributes = {}, options = {}) {
    // Apply hidden attributes to default scope
    const hiddenFields = this.hidden || [];
    const enhancedOptions = {
      timestamps: true,
      paranoid: false,
      underscored: true,
      ...options,
    };

    if (hiddenFields.length > 0) {
      enhancedOptions.defaultScope = {
        attributes: { exclude: hiddenFields },
        ...(enhancedOptions.defaultScope || {}),
      };
    }

    return super.init(attributes, enhancedOptions);
  }

  /**
   * Auto-initialize model from existing database table
   */
  static autoInit(sequelize, customOptions = {}) {
    const modelName = this.name;
    const tableName = customOptions.tableName || modelName.toLowerCase() + "s";

    // Use Sequelize's define method which is better for auto-initialization
    const model = sequelize.define(
      modelName,
      {},
      {
        tableName,
        timestamps: true,
        paranoid: false,
        underscored: true,
        ...customOptions,
      }
    );

    // Copy the BaseModel methods to the defined model
    Object.setPrototypeOf(model, this);
    Object.setPrototypeOf(model.prototype, this.prototype);

    return model;
  }

  /**
   * Get model's table name
   */
  static getTableName() {
    return this.tableName || this.name.toLowerCase() + "s";
  }

  /**
   * Get model's primary key field name
   */
  static getPrimaryKeyField() {
    return this.primaryKeyAttribute || "id";
  }

  /**
   * Fire the given event for the model.
   * @param {string} event
   * @param {boolean} halt
   * @returns {mixed}
   */
  fireModelEvent(event, halt = true) {
    if (!this.constructor.getEventDispatcher()) {
      return true;
    }

    // Implementation would depend on event system
    // For now, just call the event method if it exists
    const method = event;
    if (typeof this[method] === "function") {
      return this[method]();
    }

    return true;
  }

  /**
   * Get the event dispatcher instance.
   * @returns {Object|null}
   */
  static getEventDispatcher() {
    return null; // Would be implemented with actual event system
  }

  /**
   * Sync the original attributes with the current.
   */
  syncOriginal() {
    this.original = { ...this.dataValues };
  }

  /**
   * Fill the model with an array of attributes.
   * @param {Object} attributes
   * @returns {this}
   */
  fill(attributes) {
    const fillable = this.constructor.fillable || [];

    if (fillable.length === 0) {
      // If no fillable defined, allow all attributes
      Object.assign(this.dataValues, attributes);
      return this;
    }

    // Only assign fillable attributes
    Object.keys(attributes).forEach((key) => {
      if (fillable.includes(key)) {
        this.dataValues[key] = attributes[key];
      }
    });

    return this;
  }

  /**
   * Create model instance with fillable validation
   */
  static async create(values, options = {}) {
    const fillableFields = this.fillable || [];

    if (fillableFields.length > 0) {
      // Only keep fillable fields
      const filteredValues = {};
      Object.keys(values).forEach((key) => {
        if (fillableFields.includes(key)) {
          filteredValues[key] = values[key];
        }
      });
      return super.create(filteredValues, options);
    }

    return super.create(values, options);
  }

  /**
   * Update model instance with fillable validation
   */
  async update(values, options = {}) {
    const fillableFields = this.constructor.fillable || [];

    if (fillableFields.length > 0) {
      // Only keep fillable fields
      const filteredValues = {};
      Object.keys(values).forEach((key) => {
        if (fillableFields.includes(key)) {
          filteredValues[key] = values[key];
        }
      });
      return super.update(filteredValues, options);
    }

    return super.update(values, options);
  }

  /**
   * Override toJSON to apply hidden attributes and casts
   */
  toJSON() {
    const data = super.toJSON();
    const hiddenFields = this.constructor.hidden || [];
    const casts = this.constructor.casts || {};

    // Remove hidden fields
    hiddenFields.forEach((field) => {
      delete data[field];
    });

    // Apply casts
    Object.keys(casts).forEach((field) => {
      if (data[field] !== undefined) {
        data[field] = this.castAttribute(field, data[field], casts[field]);
      }
    });

    return data;
  }

  /**
   * Cast attribute to specified type
   */
  castAttribute(field, value, castType) {
    if (value === null || value === undefined) {
      return value;
    }

    switch (castType) {
      case "string":
        return String(value);
      case "integer":
      case "int":
        return parseInt(value, 10);
      case "float":
      case "double":
        return parseFloat(value);
      case "boolean":
      case "bool":
        return Boolean(value);
      case "date":
        return value instanceof Date ? value : new Date(value);
      case "array":
        return Array.isArray(value) ? value : JSON.parse(value);
      case "object":
        return typeof value === "object" ? value : JSON.parse(value);
      default:
        return value;
    }
  }

  /**
   * Check if record exists by field
   */
  static async exists(field, value) {
    const count = await this.count({
      where: { [field]: value },
    });
    return count > 0;
  }

  /**
   * Find model by specific field value
   */
  static async findByField(field, value, options = {}) {
    return this.findOne({
      where: { [field]: value },
      ...options,
    });
  }

  /**
   * Search models by multiple fields
   */
  static async search(query, fields = [], options = {}) {
    if (!fields.length) {
      return this.findAll(options);
    }

    const { Op } = Sequelize;
    const sequelize = this.sequelize;

    // Use appropriate LIKE operator based on dialect
    const likeOp = sequelize.getDialect() === "postgres" ? Op.iLike : Op.like;

    const whereConditions = fields.map((field) => ({
      [field]: { [likeOp]: `%${query}%` },
    }));

    return this.findAll({
      where: { [Op.or]: whereConditions },
      ...options,
    });
  }

  /**
   * Get paginated results
   */
  static async paginate(page = 1, limit = 10, options = {}) {
    const offset = (page - 1) * limit;

    const { rows, count } = await this.findAndCountAll({
      limit,
      offset,
      ...options,
    });

    return {
      data: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      hasNext: page < Math.ceil(count / limit),
      hasPrev: page > 1,
    };
  }

  /**
   * Create multiple records
   */
  static async createMany(records, options = {}) {
    const fillableFields = this.fillable || [];

    if (fillableFields.length > 0) {
      // Filter each record to only include fillable fields
      const filteredRecords = records.map((record) => {
        const filteredRecord = {};
        Object.keys(record).forEach((key) => {
          if (fillableFields.includes(key)) {
            filteredRecord[key] = record[key];
          }
        });
        return filteredRecord;
      });
      return this.bulkCreate(filteredRecords, options);
    }

    return this.bulkCreate(records, options);
  }

  /**
   * Get the first record or create if it doesn't exist
   */
  static async firstOrCreate(values, defaults = {}) {
    const [instance, created] = await this.findOrCreate({
      where: values,
      defaults: { ...values, ...defaults },
    });
    return { instance, created };
  }

  /**
   * Update or create record
   */
  static async updateOrCreate(values, defaults = {}) {
    const [instance, created] = await this.findOrCreate({
      where: values,
      defaults: { ...values, ...defaults },
    });

    if (!created) {
      await instance.update(defaults);
    }

    return { instance, created };
  }

  /**
   * Check if this is a new record (not persisted)
   */
  isNewRecord() {
    return (
      this.isNewRecord === true || !this[this.constructor.getPrimaryKeyField()]
    );
  }

  /**
   * Get model's attributes as plain object
   */
  getAttributes() {
    return this.dataValues;
  }

  /**
   * Check if attribute has changed
   */
  isDirty(field = null) {
    if (field) {
      return this.changed(field);
    }
    return this.changed().length > 0;
  }

  /**
   * Get original value of attribute before changes
   */
  getOriginal(field) {
    return this.original[field];
  }

  /**
   * Refresh model from database
   */
  async fresh() {
    const primaryKey = this.constructor.getPrimaryKeyField();
    return this.constructor.findByPk(this[primaryKey]);
  }

  /**
   * Reload model from database
   */
  async refresh() {
    return this.reload();
  }

  /**
   * Apply scope to query
   */
  static scope(scopeName) {
    // Handle Sequelize's built-in scope method calls (like unscoped)
    if (scopeName === undefined || scopeName === null) {
      return super.scope ? super.scope.apply(this, arguments) : this;
    }

    const scopes = this.scopes || {};
    const scopeConfig = scopes[scopeName];

    if (!scopeConfig) {
      throw new Error(
        `Invalid scope '${scopeName}' called on ${this.name} model`
      );
    }

    // For scopes that need to bypass default scope (like withPassword), use unscoped
    const needsUnscoped =
      scopeConfig.attributes &&
      scopeConfig.attributes.exclude &&
      scopeConfig.attributes.exclude.length === 0;

    const targetModel = needsUnscoped ? this.unscoped() : this;
    const builder = new QueryBuilder(targetModel);

    // Apply scope configuration
    if (scopeConfig.attributes && !needsUnscoped) {
      builder.options.attributes = scopeConfig.attributes;
    }
    if (scopeConfig.where) {
      builder.where(scopeConfig.where);
    }
    if (scopeConfig.include) {
      builder.with(scopeConfig.include);
    }
    if (scopeConfig.order) {
      builder.orderBy(scopeConfig.order);
    }

    return builder;
  }

  /**
   * Create a new query builder instance
   */
  static query() {
    return new QueryBuilder(this);
  }

  /**
   * Enhanced findAndCountAll with query builder support
   */
  static findAndCountAll(options = {}) {
    const builder = new QueryBuilder(this);
    if (Object.keys(options).length > 0) {
      return builder.applyOptions(options).execute();
    }
    return builder;
  }

  /**
   * Enhanced findAll with query builder support
   */
  static findAll(options = {}) {
    const builder = new QueryBuilder(this, "findAll");
    if (Object.keys(options).length > 0) {
      return builder.applyOptions(options).execute();
    }
    return builder;
  }

  /**
   * Enhanced findOne with query builder support
   */
  static findOne(options = {}) {
    const builder = new QueryBuilder(this, "findOne");
    if (Object.keys(options).length > 0) {
      return builder.applyOptions(options).execute();
    }
    return builder;
  }
}

/**
 * Query Builder class for fluent query syntax
 */
class QueryBuilder {
  constructor(model, method = "findAndCountAll") {
    this.model = model;
    this.method = method;
    this.options = {};
    this.whereConditions = {};
    this.includeRelations = [];
    this.orderByFields = [];
    this.limitValue = null;
    this.offsetValue = null;
    this.scopeConditions = [];
  }

  /**
   * Add where conditions
   */
  where(field, operator = null, value = null) {
    if (typeof field === "object") {
      Object.assign(this.whereConditions, field);
    } else if (operator && value !== null) {
      if (typeof operator === "object") {
        this.whereConditions[field] = operator;
      } else {
        const { Op } = Sequelize;
        switch (operator.toLowerCase()) {
          case "like":
            this.whereConditions[field] = { [Op.like]: value };
            break;
          case "ilike":
            this.whereConditions[field] = { [Op.iLike]: value };
            break;
          case "in":
            this.whereConditions[field] = { [Op.in]: value };
            break;
          case "not in":
            this.whereConditions[field] = { [Op.notIn]: value };
            break;
          case ">":
            this.whereConditions[field] = { [Op.gt]: value };
            break;
          case ">=":
            this.whereConditions[field] = { [Op.gte]: value };
            break;
          case "<":
            this.whereConditions[field] = { [Op.lt]: value };
            break;
          case "<=":
            this.whereConditions[field] = { [Op.lte]: value };
            break;
          case "!=":
          case "<>":
            this.whereConditions[field] = { [Op.ne]: value };
            break;
          default:
            this.whereConditions[field] = value;
        }
      }
    } else if (operator !== null) {
      this.whereConditions[field] = operator;
    }
    return this;
  }

  /**
   * Add OR where conditions
   */
  orWhere(field, operator = null, value = null) {
    const { Op } = Sequelize;
    const condition = {};

    if (typeof field === "object") {
      Object.assign(condition, field);
    } else if (operator && value !== null) {
      if (typeof operator === "object") {
        condition[field] = operator;
      } else {
        switch (operator.toLowerCase()) {
          case "like":
            condition[field] = { [Op.like]: value };
            break;
          case "ilike":
            condition[field] = { [Op.iLike]: value };
            break;
          default:
            condition[field] = value;
        }
      }
    } else if (operator !== null) {
      condition[field] = operator;
    }

    if (this.whereConditions[Op.or]) {
      this.whereConditions[Op.or].push(condition);
    } else {
      this.whereConditions[Op.or] = [this.whereConditions, condition];
      delete this.whereConditions[
        Object.keys(this.whereConditions).find((key) => key !== Op.or)
      ];
    }

    return this;
  }

  /**
   * Add search conditions across multiple fields
   */
  search(query, fields = []) {
    if (!fields.length) {
      return this;
    }

    const { Op } = Sequelize;
    const sequelize = this.model.sequelize;
    const likeOp = sequelize.getDialect() === "postgres" ? Op.iLike : Op.like;

    const searchConditions = fields.map((field) => ({
      [field]: { [likeOp]: `%${query}%` },
    }));

    this.whereConditions[Op.or] = searchConditions;
    return this;
  }

  /**
   * Add include/join relations
   */
  with(associations) {
    if (Array.isArray(associations)) {
      associations.forEach((assoc) => this.parseAssociation(assoc));
    } else {
      this.parseAssociation(associations);
    }
    return this;
  }

  /**
   * Parse association string or object
   */
  parseAssociation(association) {
    if (typeof association === "string") {
      // Handle shorthand syntax like 'user:id,email,role'
      if (association.includes(":")) {
        const [model, attributes] = association.split(":");
        this.includeRelations.push({
          association: model,
          attributes: attributes.split(","),
        });
      } else {
        this.includeRelations.push({ association });
      }
    } else if (typeof association === "object") {
      this.includeRelations.push(association);
    }
  }

  /**
   * Add include/join relations (alias for with)
   */
  include(associations) {
    return this.with(associations);
  }

  /**
   * Set limit
   */
  limit(limit) {
    this.limitValue = parseInt(limit);
    return this;
  }

  /**
   * Set offset
   */
  offset(offset) {
    this.offsetValue = parseInt(offset);
    return this;
  }

  /**
   * Set pagination
   */
  paginate(page = 1, limit = 10) {
    this.limitValue = parseInt(limit);
    this.offsetValue = (parseInt(page) - 1) * parseInt(limit);
    return this;
  }

  /**
   * Add order by
   */
  orderBy(field, direction = "ASC") {
    if (Array.isArray(field)) {
      this.orderByFields = [...this.orderByFields, ...field];
    } else {
      this.orderByFields.push([field, direction.toUpperCase()]);
    }
    return this;
  }

  /**
   * Add order by descending
   */
  orderByDesc(field) {
    return this.orderBy(field, "DESC");
  }

  /**
   * Add order by ascending
   */
  orderByAsc(field) {
    return this.orderBy(field, "ASC");
  }

  /**
   * Get the latest records
   */
  latest(field = "created_at") {
    return this.orderByDesc(field);
  }

  /**
   * Get the oldest records
   */
  oldest(field = "created_at") {
    return this.orderByAsc(field);
  }

  /**
   * Apply existing options object
   */
  applyOptions(options) {
    Object.assign(this.options, options);
    return this;
  }

  /**
   * Build the final query options
   */
  buildOptions() {
    const options = { ...this.options };

    if (Object.keys(this.whereConditions).length > 0) {
      options.where = { ...options.where, ...this.whereConditions };
    }

    if (this.includeRelations.length > 0) {
      options.include = [...(options.include || []), ...this.includeRelations];
    }

    if (this.orderByFields.length > 0) {
      options.order = [...(options.order || []), ...this.orderByFields];
    }

    if (this.limitValue !== null) {
      options.limit = this.limitValue;
    }

    if (this.offsetValue !== null) {
      options.offset = this.offsetValue;
    }

    return options;
  }

  /**
   * Execute the query
   */
  async execute() {
    const options = this.buildOptions();

    // Use Sequelize Model methods directly
    const { Model } = Sequelize;

    switch (this.method) {
      case "findAll":
        return await Model.findAll.call(this.model, options);
      case "findOne":
        return await Model.findOne.call(this.model, options);
      case "findAndCountAll":
      default:
        return await Model.findAndCountAll.call(this.model, options);
    }
  }

  /**
   * Get first result
   */
  async first() {
    this.method = "findOne";
    return await this.execute();
  }

  /**
   * Get all results
   */
  async get() {
    if (this.method === "findAndCountAll") {
      const result = await this.execute();
      return result.rows;
    }
    this.method = "findAll";
    return await this.execute();
  }

  /**
   * Get count
   */
  async count() {
    const options = this.buildOptions();
    return await this.model.count(options);
  }

  /**
   * Check if any records exist
   */
  async exists() {
    const count = await this.count();
    return count > 0;
  }

  /**
   * Conditional query execution
   */
  when(condition, callback) {
    if (condition) {
      callback(this);
    }
    return this;
  }

  /**
   * Count distinct values
   */
  async countDistinct(field) {
    const options = this.buildOptions();
    const { fn, col } = Sequelize;
    return await this.model.count({
      ...options,
      distinct: true,
      col: field,
    });
  }

  /**
   * Delete records
   */
  async delete() {
    const options = this.buildOptions();
    return await this.model.destroy(options);
  }

  /**
   * Find by primary key with query builder
   */
  async findByPk(id) {
    const options = this.buildOptions();
    return await this.model.findByPk(id, options);
  }

  /**
   * Make the builder thenable (Promise-like)
   */
  then(onFulfilled, onRejected) {
    return this.execute().then(onFulfilled, onRejected);
  }

  /**
   * Make the builder catchable
   */
  catch(onRejected) {
    return this.execute().catch(onRejected);
  }
}

export default BaseModel;
