/**
 * HasEvents concern
 *
 * Provides model event functionality
 */
class HasEvents {
  static name = "HasEvents";

  /**
   * The event dispatcher instance.
   * @type {Object|null}
   */
  static dispatcher = null;

  /**
   * Boot the HasEvents trait for a model.
   */
  static bootHasEvents() {
    // Boot logic for events
  }

  /**
   * Initialize the HasEvents trait for an instance.
   */
  initializeHasEvents() {
    // Instance initialization
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

    // Model events that can be fired
    const events = [
      "retrieved",
      "creating",
      "created",
      "updating",
      "updated",
      "saving",
      "saved",
      "deleting",
      "deleted",
      "restoring",
      "restored",
      "replicating",
      "booting",
      "booted",
    ];

    if (!events.includes(event)) {
      return true;
    }

    // Call the event method if it exists on the model
    const method = event;
    if (typeof this[method] === "function") {
      const result = this[method]();
      if (halt && result === false) {
        return false;
      }
    }

    // Fire the global event if dispatcher exists
    if (this.constructor.dispatcher) {
      const eventName = `eloquent.${event}: ${this.constructor.name}`;
      return this.constructor.dispatcher.fire(eventName, this);
    }

    return true;
  }

  /**
   * Register a model event with the dispatcher.
   * @param {string} event
   * @param {Function} callback
   */
  static registerModelEvent(event, callback) {
    if (this.dispatcher) {
      const eventName = `eloquent.${event}: ${this.name}`;
      this.dispatcher.listen(eventName, callback);
    }
  }

  /**
   * Register a creating model event with the dispatcher.
   * @param {Function} callback
   */
  static creating(callback) {
    this.registerModelEvent("creating", callback);
  }

  /**
   * Register a created model event with the dispatcher.
   * @param {Function} callback
   */
  static created(callback) {
    this.registerModelEvent("created", callback);
  }

  /**
   * Register an updating model event with the dispatcher.
   * @param {Function} callback
   */
  static updating(callback) {
    this.registerModelEvent("updating", callback);
  }

  /**
   * Register an updated model event with the dispatcher.
   * @param {Function} callback
   */
  static updated(callback) {
    this.registerModelEvent("updated", callback);
  }

  /**
   * Register a saving model event with the dispatcher.
   * @param {Function} callback
   */
  static saving(callback) {
    this.registerModelEvent("saving", callback);
  }

  /**
   * Register a saved model event with the dispatcher.
   * @param {Function} callback
   */
  static saved(callback) {
    this.registerModelEvent("saved", callback);
  }

  /**
   * Register a deleting model event with the dispatcher.
   * @param {Function} callback
   */
  static deleting(callback) {
    this.registerModelEvent("deleting", callback);
  }

  /**
   * Register a deleted model event with the dispatcher.
   * @param {Function} callback
   */
  static deleted(callback) {
    this.registerModelEvent("deleted", callback);
  }

  /**
   * Get the event dispatcher instance.
   * @returns {Object|null}
   */
  static getEventDispatcher() {
    return this.dispatcher;
  }

  /**
   * Set the event dispatcher instance.
   * @param {Object} dispatcher
   */
  static setEventDispatcher(dispatcher) {
    this.dispatcher = dispatcher;
  }

  /**
   * Execute a callback without firing any model events.
   * @param {Function} callback
   * @returns {mixed}
   */
  static withoutEvents(callback) {
    const dispatcher = this.getEventDispatcher();
    this.setEventDispatcher(null);

    try {
      return callback();
    } finally {
      this.setEventDispatcher(dispatcher);
    }
  }
}

module.exports = HasEvents;
