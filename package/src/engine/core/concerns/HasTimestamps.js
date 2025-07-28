/**
 * HasTimestamps concern
 *
 * Provides timestamp management functionality
 */
class HasTimestamps {
  static name = "HasTimestamps";

  /**
   * Boot the HasTimestamps trait for a model.
   */
  static bootHasTimestamps() {
    // Boot logic for timestamps
  }

  /**
   * Initialize the HasTimestamps trait for an instance.
   */
  initializeHasTimestamps() {
    // Instance initialization
  }

  /**
   * Determine if the model uses timestamps.
   * @returns {boolean}
   */
  usesTimestamps() {
    return this.constructor.timestamps !== false;
  }

  /**
   * Get the name of the "created at" column.
   * @returns {string|null}
   */
  getCreatedAtColumn() {
    return this.constructor.CREATED_AT;
  }

  /**
   * Get the name of the "updated at" column.
   * @returns {string|null}
   */
  getUpdatedAtColumn() {
    return this.constructor.UPDATED_AT;
  }

  /**
   * Get a fresh timestamp for the model.
   * @returns {Date}
   */
  freshTimestamp() {
    return new Date();
  }

  /**
   * Get a fresh timestamp for the model as string.
   * @returns {string}
   */
  freshTimestampString() {
    return this.freshTimestamp().toISOString();
  }

  /**
   * Update the creation and update timestamps.
   */
  updateTimestamps() {
    const time = this.freshTimestamp();

    const updatedAtColumn = this.getUpdatedAtColumn();
    if (updatedAtColumn && !this.isDirty(updatedAtColumn)) {
      this.setUpdatedAt(time);
    }

    const createdAtColumn = this.getCreatedAtColumn();
    if (!this.exists && createdAtColumn && !this.isDirty(createdAtColumn)) {
      this.setCreatedAt(time);
    }
  }

  /**
   * Set the value of the "created at" attribute.
   * @param {Date|string} value
   * @returns {this}
   */
  setCreatedAt(value) {
    const column = this.getCreatedAtColumn();
    if (column) {
      this.setAttribute(column, value);
    }
    return this;
  }

  /**
   * Set the value of the "updated at" attribute.
   * @param {Date|string} value
   * @returns {this}
   */
  setUpdatedAt(value) {
    const column = this.getUpdatedAtColumn();
    if (column) {
      this.setAttribute(column, value);
    }
    return this;
  }

  /**
   * Get the value of the "created at" attribute.
   * @returns {Date|string|null}
   */
  getCreatedAt() {
    const column = this.getCreatedAtColumn();
    return column ? this.getAttribute(column) : null;
  }

  /**
   * Get the value of the "updated at" attribute.
   * @returns {Date|string|null}
   */
  getUpdatedAt() {
    const column = this.getUpdatedAtColumn();
    return column ? this.getAttribute(column) : null;
  }
}

export default HasTimestamps;
