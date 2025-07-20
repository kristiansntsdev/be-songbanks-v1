const { Sequelize, Model, DataTypes } = require('sequelize');
const { ulid } = require('ulid');

// Import concerns/traits
const HasAttributes = require('./concerns/HasAttributes');
const GuardsAttributes = require('./concerns/GuardsAttributes');
const HidesAttributes = require('./concerns/HidesAttributes');
const HasTimestamps = require('./concerns/HasTimestamps');
const HasEvents = require('./concerns/HasEvents');

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
    primaryKey = 'id';

    /**
     * The "type" of the primary key ID.
     * @type {string}
     */
    keyType = 'string';

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
    static CREATED_AT = 'created_at';

    /**
     * The name of the "updated at" column.
     * @type {string|null}
     */
    static UPDATED_AT = 'updated_at';

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

            this.fireModelEvent('booting', false);

            if (typeof this.constructor.booting === 'function') {
                this.constructor.booting();
            }
            if (typeof this.constructor.boot === 'function') {
                this.constructor.boot();
            }
            if (typeof this.constructor.booted === 'function') {
                this.constructor.booted();
            }

            this.fireModelEvent('booted', false);
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

        traits.forEach(trait => {
            const bootMethod = `boot${trait.name}`;
            const initializeMethod = `initialize${trait.name}`;

            // Call boot method if exists
            if (typeof this[bootMethod] === 'function') {
                this[bootMethod]();
            }

            // Register initialize method if exists
            if (typeof this.prototype[initializeMethod] === 'function') {
                if (!BaseModel.traitInitializers[className].includes(initializeMethod)) {
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

        initializers.forEach(method => {
            if (typeof this[method] === 'function') {
                this[method]();
            }
        });
    }

    /**
     * Perform any actions required after the model boots.
     */
    static booted() {
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
            HasEvents
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
            ...options
        };
        
        if (hiddenFields.length > 0) {
            enhancedOptions.defaultScope = {
                attributes: { exclude: hiddenFields },
                ...(enhancedOptions.defaultScope || {})
            };
        }

        return super.init(attributes, enhancedOptions);
    }

    /**
     * Auto-initialize model from existing database table
     */
    static autoInit(sequelize, customOptions = {}) {
        const modelName = this.name;
        const tableName = customOptions.tableName || modelName.toLowerCase() + 's';
        
        // Use Sequelize's define method which is better for auto-initialization
        const model = sequelize.define(modelName, {}, {
            tableName,
            timestamps: true,
            paranoid: false,
            underscored: true,
            ...customOptions
        });
        
        // Copy the BaseModel methods to the defined model
        Object.setPrototypeOf(model, this);
        Object.setPrototypeOf(model.prototype, this.prototype);
        
        return model;
    }

    /**
     * Get model's table name
     */
    static getTableName() {
        return this.tableName || this.name.toLowerCase() + 's';
    }


    /**
     * Get model's primary key field name
     */
    static getPrimaryKeyField() {
        return this.primaryKeyAttribute || 'id';
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
        if (typeof this[method] === 'function') {
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
        Object.keys(attributes).forEach(key => {
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
            Object.keys(values).forEach(key => {
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
            Object.keys(values).forEach(key => {
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
        hiddenFields.forEach(field => {
            delete data[field];
        });

        // Apply casts
        Object.keys(casts).forEach(field => {
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
            case 'string':
                return String(value);
            case 'integer':
            case 'int':
                return parseInt(value, 10);
            case 'float':
            case 'double':
                return parseFloat(value);
            case 'boolean':
            case 'bool':
                return Boolean(value);
            case 'date':
                return value instanceof Date ? value : new Date(value);
            case 'array':
                return Array.isArray(value) ? value : JSON.parse(value);
            case 'object':
                return typeof value === 'object' ? value : JSON.parse(value);
            default:
                return value;
        }
    }

    /**
     * Check if record exists by field
     */
    static async exists(field, value) {
        const count = await this.count({
            where: { [field]: value }
        });
        return count > 0;
    }

    /**
     * Find model by specific field value
     */
    static async findByField(field, value, options = {}) {
        return this.findOne({
            where: { [field]: value },
            ...options
        });
    }

    /**
     * Search models by multiple fields
     */
    static async search(query, fields = [], options = {}) {
        if (!fields.length) {
            return this.findAll(options);
        }

        const { Op } = require('sequelize');
        const sequelize = this.sequelize;
        
        // Use appropriate LIKE operator based on dialect
        const likeOp = sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
        
        const whereConditions = fields.map(field => ({
            [field]: { [likeOp]: `%${query}%` }
        }));

        return this.findAll({
            where: { [Op.or]: whereConditions },
            ...options
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
            ...options
        });

        return {
            data: rows,
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            hasNext: page < Math.ceil(count / limit),
            hasPrev: page > 1
        };
    }

    /**
     * Create multiple records
     */
    static async createMany(records, options = {}) {
        const fillableFields = this.fillable || [];
        
        if (fillableFields.length > 0) {
            // Filter each record to only include fillable fields
            const filteredRecords = records.map(record => {
                const filteredRecord = {};
                Object.keys(record).forEach(key => {
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
            defaults: { ...values, ...defaults }
        });
        return { instance, created };
    }

    /**
     * Update or create record
     */
    static async updateOrCreate(values, defaults = {}) {
        const [instance, created] = await this.findOrCreate({
            where: values,
            defaults: { ...values, ...defaults }
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
        return this.isNewRecord === true || !this[this.constructor.getPrimaryKeyField()];
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
}

module.exports = BaseModel;