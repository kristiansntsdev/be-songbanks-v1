/**
 * Relationship classes for Factory system
 * Handle different types of model relationships
 */

class Relationship {
    constructor(factory, relationshipName) {
        this.factory = factory;
        this.relationshipName = relationshipName;
        this.recycleModels = new Map();
    }

    recycle(models) {
        this.recycleModels = models;
        return this;
    }

    async createFor(parentModel) {
        throw new Error('createFor must be implemented by subclass');
    }
}

class HasOneRelationship extends Relationship {
    constructor(factory, relationshipName, attributes = {}) {
        super(factory, relationshipName);
        this.attributes = attributes;
    }

    async createFor(parentModel) {
        const foreignKey = this.getForeignKey(parentModel);
        const childAttributes = {
            [foreignKey]: parentModel.id,
            ...this.attributes
        };

        const child = await this.factory
            .recycle(this.recycleModels)
            .state(childAttributes)
            .create();

        // Set relationship on parent if it has a setter
        if (typeof parentModel.setRelation === 'function') {
            parentModel.setRelation(this.relationshipName, child);
        }

        return child;
    }

    getForeignKey(parentModel) {
        const parentName = parentModel.constructor.name.toLowerCase();
        return `${parentName}_id`;
    }
}

class HasManyRelationship extends Relationship {
    constructor(factory, relationshipName, count = 1, attributes = {}) {
        super(factory, relationshipName);
        this.count = count;
        this.attributes = attributes;
    }

    async createFor(parentModel) {
        const foreignKey = this.getForeignKey(parentModel);
        const childAttributes = {
            [foreignKey]: parentModel.id,
            ...this.attributes
        };

        const children = await this.factory
            .recycle(this.recycleModels)
            .count(this.count)
            .state(childAttributes)
            .create();

        // Set relationship on parent if it has a setter
        if (typeof parentModel.setRelation === 'function') {
            parentModel.setRelation(this.relationshipName, Array.isArray(children) ? children : [children]);
        }

        return children;
    }

    getForeignKey(parentModel) {
        const parentName = parentModel.constructor.name.toLowerCase();
        return `${parentName}_id`;
    }
}

class BelongsToRelationship extends Relationship {
    constructor(factory, relationshipName, attributes = {}) {
        super(factory, relationshipName);
        this.attributes = attributes;
    }

    attributesFor(childModel) {
        const foreignKey = this.getForeignKey();
        
        // Check if we have a recycled model
        const recycled = this.getRecycledModel();
        if (recycled) {
            return { [foreignKey]: recycled.id };
        }

        // Return a lazy reference that will be resolved later
        return {
            [foreignKey]: () => {
                return this.factory
                    .recycle(this.recycleModels)
                    .state(this.attributes)
                    .create()
                    .then(parent => parent.id);
            }
        };
    }

    getForeignKey() {
        const parentName = this.factory.modelName().toLowerCase();
        return `${parentName}_id`;
    }

    getRecycledModel() {
        const modelName = this.factory.modelName();
        const models = this.recycleModels.get(modelName);
        if (models && models.length > 0) {
            return models[Math.floor(Math.random() * models.length)];
        }
        return null;
    }
}

class BelongsToManyRelationship extends Relationship {
    constructor(factory, relationshipName, count = 1, pivot = {}) {
        super(factory, relationshipName);
        this.count = count;
        this.pivot = pivot;
    }

    async createFor(parentModel) {
        // Create the related models
        const relatedModels = await this.factory
            .recycle(this.recycleModels)
            .count(this.count)
            .create();

        const models = Array.isArray(relatedModels) ? relatedModels : [relatedModels];

        // Handle pivot table if parent model supports it
        if (typeof parentModel.attach === 'function') {
            for (const model of models) {
                const pivotData = typeof this.pivot === 'function' ? this.pivot() : this.pivot;
                await parentModel.attach(this.relationshipName, model.id, pivotData);
            }
        }

        // Set relationship on parent if it has a setter
        if (typeof parentModel.setRelation === 'function') {
            parentModel.setRelation(this.relationshipName, models);
        }

        return models;
    }
}

class MorphToRelationship extends Relationship {
    constructor(factories, relationshipName, typeField = 'type', idField = 'id') {
        super(null, relationshipName);
        this.factories = Array.isArray(factories) ? factories : [factories];
        this.typeField = typeField;
        this.idField = idField;
    }

    attributesFor(childModel) {
        // Randomly select one of the provided factories
        const factory = this.factories[Math.floor(Math.random() * this.factories.length)];
        const modelName = factory.modelName();

        // Check for recycled model
        const recycled = this.getRecycledModel(modelName);
        if (recycled) {
            return {
                [this.typeField]: modelName,
                [this.idField]: recycled.id
            };
        }

        // Return lazy reference
        return {
            [this.typeField]: modelName,
            [this.idField]: () => {
                return factory
                    .recycle(this.recycleModels)
                    .create()
                    .then(model => model.id);
            }
        };
    }

    getRecycledModel(modelName) {
        const models = this.recycleModels.get(modelName);
        if (models && models.length > 0) {
            return models[Math.floor(Math.random() * models.length)];
        }
        return null;
    }
}

class Sequence {
    constructor(...values) {
        this.values = values;
        this.index = 0;
    }

    next() {
        const value = this.values[this.index % this.values.length];
        this.index++;
        return typeof value === 'function' ? value(this.index - 1) : value;
    }

    // Make it callable
    call(attributes) {
        return this.next();
    }
}

class CrossJoinSequence {
    constructor(...sequences) {
        this.sequences = sequences;
        this.index = 0;
    }

    next() {
        const result = {};
        const totalCombinations = this.sequences.reduce((acc, seq) => acc * seq.length, 1);
        const currentIndex = this.index % totalCombinations;
        
        let divisor = totalCombinations;
        for (let i = 0; i < this.sequences.length; i++) {
            const sequence = this.sequences[i];
            divisor = Math.floor(divisor / sequence.length);
            const seqIndex = Math.floor(currentIndex / divisor) % sequence.length;
            const value = sequence[seqIndex];
            
            if (typeof value === 'object') {
                Object.assign(result, value);
            }
        }
        
        this.index++;
        return result;
    }

    call(attributes) {
        return this.next();
    }
}

module.exports = {
    Relationship,
    HasOneRelationship,
    HasManyRelationship,
    BelongsToRelationship,
    BelongsToManyRelationship,
    MorphToRelationship,
    Sequence,
    CrossJoinSequence
};