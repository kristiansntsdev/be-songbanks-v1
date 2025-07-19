const faker = require('@faker-js/faker').faker;

class Factory {
    constructor(model, attributes = {}) {
        this.model = model;
        this.modelName = typeof model === 'string' ? model : model.name;
        this.attributes = attributes;
        this._count = 1;
        this.states = [];
        this.afterMaking = [];
        this.afterCreating = [];
        this.relationships = [];
    }

    /**
     * Create a new factory instance
     */
    static define(model, attributes) {
        return new Factory(model, attributes);
    }

    /**
     * Generate fake data for the factory
     */
    static fake() {
        return faker;
    }

    /**
     * Set the number of models to generate
     */
    count(number) {
        this._count = number;
        return this;
    }

    /**
     * Apply a state to the factory
     */
    state(state) {
        if (typeof state === 'string') {
            this.states.push(state);
        } else if (typeof state === 'object') {
            this.attributes = { ...this.attributes, ...state };
        }
        return this;
    }

    /**
     * Define relationships
     */
    has(relationship, count = 1, attributes = {}) {
        this.relationships.push({
            type: 'has',
            name: relationship,
            count: count,
            attributes: attributes
        });
        return this;
    }

    /**
     * Define hasMany relationship with specific count
     */
    hasMany(relationship, count = 3, attributes = {}) {
        return this.has(relationship, count, attributes);
    }

    /**
     * Define hasOne relationship
     */
    hasOne(relationship, attributes = {}) {
        return this.has(relationship, 1, attributes);
    }

    /**
     * Define belongsTo relationship
     */
    for(parentFactory) {
        this.relationships.push({
            type: 'for',
            factory: parentFactory
        });
        return this;
    }

    /**
     * Add callback after making (not saving)
     */
    afterMaking(callback) {
        this.afterMaking.push(callback);
        return this;
    }

    /**
     * Add callback after creating (saving)
     */
    afterCreating(callback) {
        this.afterCreating.push(callback);
        return this;
    }

    /**
     * Generate raw attributes without creating model instances
     */
    async raw(overrides = {}) {
        const generated = [];
        
        for (let i = 0; i < this._count; i++) {
            let attributes = { ...this.attributes };
            
            // Apply state modifications
            for (const state of this.states) {
                if (typeof state === 'function') {
                    attributes = { ...attributes, ...state(attributes) };
                }
            }
            
            // Resolve any functions in attributes
            for (const [key, value] of Object.entries(attributes)) {
                if (typeof value === 'function') {
                    attributes[key] = await value();
                }
            }
            
            // Apply overrides
            attributes = { ...attributes, ...overrides };
            
            generated.push(attributes);
        }
        
        return this._count === 1 ? generated[0] : generated;
    }

    /**
     * Generate model instances without saving
     */
    async make(overrides = {}) {
        const rawAttributes = await this.raw(overrides);
        const instances = Array.isArray(rawAttributes) ? rawAttributes : [rawAttributes];
        
        const models = instances.map(attrs => {
            const instance = this.createModelInstance(attrs);
            
            // Execute afterMaking callbacks
            this.afterMaking.forEach(callback => callback(instance));
            
            return instance;
        });
        
        return this._count === 1 ? models[0] : models;
    }

    /**
     * Create and save model instances
     */
    async create(overrides = {}) {
        const instances = await this.make(overrides);
        const models = Array.isArray(instances) ? instances : [instances];
        
        const saved = [];
        for (const instance of models) {
            // Save the instance
            const savedInstance = await this.saveModelInstance(instance);
            
            // Handle relationships
            for (const relationship of this.relationships) {
                await this.handleRelationship(savedInstance, relationship);
            }
            
            // Execute afterCreating callbacks
            this.afterCreating.forEach(callback => callback(savedInstance));
            
            saved.push(savedInstance);
        }
        
        return this._count === 1 ? saved[0] : saved;
    }

    /**
     * Create model instance (override in subclasses)
     */
    createModelInstance(attributes) {
        if (typeof this.model === 'function') {
            return new this.model(attributes);
        }
        
        // For string model names, return plain object without _model metadata
        return { ...attributes };
    }

    /**
     * Save model instance (override in subclasses)
     */
    async saveModelInstance(instance) {
        if (instance.save && typeof instance.save === 'function') {
            return await instance.save();
        }
        
        // For plain objects, simulate saving
        return { ...instance, id: this.generateId() };
    }

    /**
     * Handle relationships
     */
    async handleRelationship(instance, relationship) {
        if (relationship.type === 'has') {
            // Create related models
            const RelatedFactory = this.getFactoryForRelationship(relationship.name);
            if (RelatedFactory) {
                await RelatedFactory
                    .count(relationship.count)
                    .state(relationship.attributes)
                    .for(instance)
                    .create();
            }
        } else if (relationship.type === 'for') {
            // Set parent relationship
            const parent = await relationship.factory.create();
            instance[this.getParentKey(relationship.factory)] = parent.id;
        }
    }

    /**
     * Get factory for relationship (override in subclasses)
     */
    getFactoryForRelationship(relationshipName) {
        // This would be implemented by the factory registry
        return null;
    }

    /**
     * Get parent foreign key name
     */
    getParentKey(parentFactory) {
        const parentName = parentFactory.modelName.toLowerCase();
        return `${parentName}_id`;
    }

    /**
     * Generate ID (override for specific ID types)
     */
    generateId() {
        const { ulid } = require('ulid');
        return ulid();
    }

    /**
     * Create a sequence generator
     */
    static sequence(callback) {
        let index = 0;
        return () => callback(++index);
    }

    /**
     * Create a lazy evaluation function
     */
    static lazy(callback) {
        return callback;
    }
}

module.exports = Factory;