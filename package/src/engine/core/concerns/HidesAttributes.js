/**
 * HidesAttributes concern
 *
 * Provides attribute hiding functionality for JSON serialization
 */
class HidesAttributes {
  static name = "HidesAttributes";

  /**
   * Boot the HidesAttributes trait for a model.
   */
  static bootHidesAttributes() {
    // Boot logic for hiding attributes
  }

  /**
   * Initialize the HidesAttributes trait for an instance.
   */
  initializeHidesAttributes() {
    // Instance initialization
  }

  /**
   * Get the hidden attributes for the model.
   * @returns {Array}
   */
  getHidden() {
    return this.constructor.hidden || [];
  }

  /**
   * Set the hidden attributes for the model.
   * @param {Array} hidden
   * @returns {this}
   */
  setHidden(hidden) {
    this.constructor.hidden = hidden;
    return this;
  }

  /**
   * Get the visible attributes for the model.
   * @returns {Array}
   */
  getVisible() {
    return this.constructor.visible || [];
  }

  /**
   * Set the visible attributes for the model.
   * @param {Array} visible
   * @returns {this}
   */
  setVisible(visible) {
    this.constructor.visible = visible;
    return this;
  }

  /**
   * Make the given, typically hidden, attributes visible.
   * @param {Array|string} attributes
   * @returns {this}
   */
  makeVisible(attributes) {
    const attrs = Array.isArray(attributes) ? attributes : [attributes];
    const hidden = this.getHidden();

    this.setHidden(hidden.filter((attr) => !attrs.includes(attr)));

    return this;
  }

  /**
   * Make the given, typically visible, attributes hidden.
   * @param {Array|string} attributes
   * @returns {this}
   */
  makeHidden(attributes) {
    const attrs = Array.isArray(attributes) ? attributes : [attributes];
    const hidden = this.getHidden();

    this.setHidden([...new Set([...hidden, ...attrs])]);

    return this;
  }

  /**
   * Convert the model's attributes to an array.
   * @returns {Object}
   */
  attributesToArray() {
    const attributes = this.getAttributes();
    const hidden = this.getHidden();
    const visible = this.getVisible();

    // If visible is specified, only show those
    if (visible.length > 0) {
      const filtered = {};
      visible.forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(attributes, key)) {
          filtered[key] = attributes[key];
        }
      });
      return filtered;
    }

    // Otherwise, hide the hidden attributes
    const filtered = { ...attributes };
    hidden.forEach((key) => {
      delete filtered[key];
    });

    return filtered;
  }
}

module.exports = HidesAttributes;
