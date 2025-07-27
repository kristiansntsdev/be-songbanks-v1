const Blueprint = require("./Blueprint");

class Schema {
  constructor(queryInterface, Sequelize) {
    this.queryInterface = queryInterface;
    this.Sequelize = Sequelize;
  }

  /**
   * Create a new table
   * @param {string} tableName
   * @param {function} callback
   */
  async create(tableName, callback) {
    const blueprint = new Blueprint(
      tableName,
      this.queryInterface,
      this.Sequelize
    );

    // Execute the callback with the blueprint
    callback(blueprint);

    // Build the table
    await blueprint.build();
  }

  /**
   * Modify an existing table
   * @param {string} tableName
   * @param {function} callback
   */
  async table(tableName, callback) {
    const blueprint = new Blueprint(
      tableName,
      this.queryInterface,
      this.Sequelize
    );

    // Execute the callback with the blueprint
    callback(blueprint);

    // For table modifications, we'd need different logic
    // This is a simplified version - you can extend it
    console.warn(
      "Schema.table() is not fully implemented yet. Use queryInterface directly for table modifications."
    );
  }

  /**
   * Drop a table
   * @param {string} tableName
   */
  async drop(tableName) {
    await this.queryInterface.dropTable(tableName);
  }

  /**
   * Drop a table if it exists
   * @param {string} tableName
   */
  async dropIfExists(tableName) {
    try {
      await this.queryInterface.dropTable(tableName);
    } catch (error) {
      // Ignore error if table doesn't exist
      if (
        !error.message.includes("table") ||
        !error.message.includes("exist")
      ) {
        throw error;
      }
    }
  }

  /**
   * Check if table exists
   * @param {string} tableName
   */
  async hasTable(tableName) {
    try {
      const tableExists = await this.queryInterface.describeTable(tableName);
      return !!tableExists;
    } catch (error) {
      return false;
    }
  }

  /**
   * Rename a table
   * @param {string} from
   * @param {string} to
   */
  async rename(from, to) {
    await this.queryInterface.renameTable(from, to);
  }
}

module.exports = Schema;
