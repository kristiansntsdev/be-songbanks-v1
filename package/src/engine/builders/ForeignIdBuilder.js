const ColumnBuilder = require("./ColumnBuilder");
const ForeignKeyBuilder = require("./ForeignKeyBuilder");

class ForeignIdBuilder extends ColumnBuilder {
  constructor(columnName, blueprint) {
    super(columnName, blueprint);
  }

  /**
   * Set the referenced table and column for foreign key
   */
  references(table, column = "id") {
    // Add the foreign key constraint
    this.blueprint.foreignKeys.push({
      columnName: this.columnName,
      referencedTable: table,
      referencedColumn: column,
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    return this;
  }

  /**
   * Set ON DELETE action
   */
  onDelete(action) {
    // Find the foreign key and update it
    const fk = this.blueprint.foreignKeys.find(
      (fk) => fk.columnName === this.columnName
    );
    if (fk) {
      fk.onDelete = action.toUpperCase();
    }
    return this;
  }

  /**
   * Set ON UPDATE action
   */
  onUpdate(action) {
    // Find the foreign key and update it
    const fk = this.blueprint.foreignKeys.find(
      (fk) => fk.columnName === this.columnName
    );
    if (fk) {
      fk.onUpdate = action.toUpperCase();
    }
    return this;
  }

  /**
   * Set custom constraint name
   */
  constraintName(name) {
    // Find the foreign key and update it
    const fk = this.blueprint.foreignKeys.find(
      (fk) => fk.columnName === this.columnName
    );
    if (fk) {
      fk.name = name;
    }
    return this;
  }

  /**
   * Shorthand for CASCADE on both delete and update
   */
  cascade() {
    const fk = this.blueprint.foreignKeys.find(
      (fk) => fk.columnName === this.columnName
    );
    if (fk) {
      fk.onDelete = "CASCADE";
      fk.onUpdate = "CASCADE";
    }
    return this;
  }

  /**
   * Shorthand for RESTRICT on both delete and update
   */
  restrict() {
    const fk = this.blueprint.foreignKeys.find(
      (fk) => fk.columnName === this.columnName
    );
    if (fk) {
      fk.onDelete = "RESTRICT";
      fk.onUpdate = "RESTRICT";
    }
    return this;
  }

  /**
   * Shorthand for SET NULL on delete
   */
  nullOnDelete() {
    const fk = this.blueprint.foreignKeys.find(
      (fk) => fk.columnName === this.columnName
    );
    if (fk) {
      fk.onDelete = "SET NULL";
    }
    return this;
  }
}

module.exports = ForeignIdBuilder;
