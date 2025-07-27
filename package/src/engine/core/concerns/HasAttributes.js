/**
 * HasAttributes concern
 *
 * Provides attribute management functionality to models
 */
class HasAttributes {
  static name = "HasAttributes";

  /**
   * Boot the HasAttributes trait for a model.
   */
  static bootHasAttributes() {
    // Boot logic for attributes
  }

  /**
   * Initialize the HasAttributes trait for an instance.
   */
  initializeHasAttributes() {
    this.attributes = {};
    this.original = {};
  }

  /**
   * Get an attribute value
   * @param {string} key
   * @returns {mixed}
   */
  getAttribute(key) {
    return this.dataValues[key];
  }

  /**
   * Set an attribute value
   * @param {string} key
   * @param {mixed} value
   */
  setAttribute(key, value) {
    this.dataValues[key] = value;
  }

  /**
   * Get all attributes
   * @returns {Object}
   */
  getAttributes() {
    return this.dataValues || {};
  }

  /**
   * Set raw attributes
   * @param {Object} attributes
   * @param {boolean} sync
   */
  setRawAttributes(attributes, sync = false) {
    this.dataValues = attributes;

    if (sync) {
      this.syncOriginal();
    }
  }
}

module.exports = HasAttributes;
