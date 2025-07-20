/**
 * GuardsAttributes concern
 * 
 * Provides mass assignment protection functionality
 */
class GuardsAttributes {
    static name = 'GuardsAttributes';

    /**
     * Boot the GuardsAttributes trait for a model.
     */
    static bootGuardsAttributes() {
        // Boot logic for mass assignment protection
    }

    /**
     * Initialize the GuardsAttributes trait for an instance.
     */
    initializeGuardsAttributes() {
        // Instance initialization
    }

    /**
     * Get the fillable attributes for the model.
     * @returns {Array}
     */
    getFillable() {
        return this.constructor.fillable || [];
    }

    /**
     * Get the guarded attributes for the model.
     * @returns {Array}
     */
    getGuarded() {
        return this.constructor.guarded || ['*'];
    }

    /**
     * Determine if the given attribute may be mass assigned.
     * @param {string} key
     * @returns {boolean}
     */
    isFillable(key) {
        const fillable = this.getFillable();
        
        if (fillable.length > 0 && fillable.includes(key)) {
            return true;
        }

        if (this.isGuarded(key)) {
            return false;
        }

        return fillable.length === 0 && !this.getGuarded().includes('*');
    }

    /**
     * Determine if the given key is guarded.
     * @param {string} key
     * @returns {boolean}
     */
    isGuarded(key) {
        const guarded = this.getGuarded();
        return guarded.includes('*') || guarded.includes(key);
    }

    /**
     * Determine if the model is totally guarded.
     * @returns {boolean}
     */
    totallyGuarded() {
        const fillable = this.getFillable();
        const guarded = this.getGuarded();
        
        return fillable.length === 0 && guarded.includes('*');
    }

    /**
     * Get the fillable attributes from the given array.
     * @param {Object} attributes
     * @returns {Object}
     */
    fillableFromArray(attributes) {
        const fillable = this.getFillable();
        
        if (fillable.length > 0) {
            const filtered = {};
            Object.keys(attributes).forEach(key => {
                if (fillable.includes(key)) {
                    filtered[key] = attributes[key];
                }
            });
            return filtered;
        }

        return attributes;
    }
}

module.exports = GuardsAttributes;