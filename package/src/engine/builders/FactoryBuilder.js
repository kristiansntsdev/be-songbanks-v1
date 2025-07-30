class FactoryBuilder {
  constructor() {
    this.definitions = new Map();
    this.states = new Map();
    this.sequences = new Map();
  }

  /**
   * Define a factory for a model
   */
  define(modelName, definition) {
    this.definitions.set(modelName, definition);
    return this;
  }

  /**
   * Define a state for a model factory
   */
  state(modelName, stateName, stateDefinition) {
    if (!this.states.has(modelName)) {
      this.states.set(modelName, new Map());
    }
    this.states.get(modelName).set(stateName, stateDefinition);
    return this;
  }

  /**
   * Define a sequence for generating incremental values
   */
  sequence(name, callback) {
    this.sequences.set(name, {
      callback: callback,
      current: 0,
    });
    return this;
  }

  /**
   * Get the next value from a sequence
   */
  nextSequence(name) {
    const sequence = this.sequences.get(name);
    if (!sequence) {
      throw new Error(`Sequence '${name}' not found`);
    }
    sequence.current++;
    return sequence.callback(sequence.current);
  }

  /**
   * Create a factory instance
   */
  async create(modelName) {
    const { default: Factory } = await import("../core/Factory.js");
    const definition = this.definitions.get(modelName);

    if (!definition) {
      throw new Error(`Factory definition for '${modelName}' not found`);
    }

    const factory = Factory.define(modelName, definition);

    // Attach states to factory
    const modelStates = this.states.get(modelName);
    if (modelStates) {
      factory._availableStates = modelStates;

      // Override state method to use defined states
      const originalState = factory.state.bind(factory);
      factory.state = function (stateName) {
        if (typeof stateName === "string" && modelStates.has(stateName)) {
          const stateDefinition = modelStates.get(stateName);
          if (typeof stateDefinition === "function") {
            this.attributes = { ...this.attributes, ...stateDefinition() };
          } else {
            this.attributes = { ...this.attributes, ...stateDefinition };
          }
          return this;
        }
        return originalState(stateName);
      };
    }

    return factory;
  }

  /**
   * Get all defined factory names
   */
  getDefinedFactories() {
    return Array.from(this.definitions.keys());
  }

  /**
   * Check if a factory is defined
   */
  hasFactory(modelName) {
    return this.definitions.has(modelName);
  }

  /**
   * Get all states for a model
   */
  getStates(modelName) {
    const modelStates = this.states.get(modelName);
    return modelStates ? Array.from(modelStates.keys()) : [];
  }

  /**
   * Clear all definitions (useful for testing)
   */
  clear() {
    this.definitions.clear();
    this.states.clear();
    this.sequences.clear();
    return this;
  }

  /**
   * Create a trait (reusable state)
   */
  trait(traitName, traitDefinition) {
    // Traits are global states that can be applied to any factory
    this._traits = this._traits || new Map();
    this._traits.set(traitName, traitDefinition);
    return this;
  }

  /**
   * Apply a trait to a factory
   */
  applyTrait(factory, traitName) {
    if (!this._traits || !this._traits.has(traitName)) {
      throw new Error(`Trait '${traitName}' not found`);
    }

    const trait = this._traits.get(traitName);
    if (typeof trait === "function") {
      factory.attributes = { ...factory.attributes, ...trait() };
    } else {
      factory.attributes = { ...factory.attributes, ...trait };
    }

    return factory;
  }

  /**
   * Create afterMaking callback
   */
  afterMaking(modelName, callback) {
    this.afterMakingCallbacks = this.afterMakingCallbacks || new Map();
    if (!this.afterMakingCallbacks.has(modelName)) {
      this.afterMakingCallbacks.set(modelName, []);
    }
    this.afterMakingCallbacks.get(modelName).push(callback);
    return this;
  }

  /**
   * Create afterCreating callback
   */
  afterCreating(modelName, callback) {
    this.afterCreatingCallbacks = this.afterCreatingCallbacks || new Map();
    if (!this.afterCreatingCallbacks.has(modelName)) {
      this.afterCreatingCallbacks.set(modelName, []);
    }
    this.afterCreatingCallbacks.get(modelName).push(callback);
    return this;
  }

  /**
   * Get callbacks for a model
   */
  getCallbacks(modelName, type) {
    const callbackMap =
      type === "afterMaking"
        ? this.afterMakingCallbacks
        : this.afterCreatingCallbacks;

    return callbackMap && callbackMap.has(modelName)
      ? callbackMap.get(modelName)
      : [];
  }
}

// Export singleton instance
export default new FactoryBuilder();
