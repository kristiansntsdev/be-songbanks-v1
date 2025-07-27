class SchemaException extends Error {
  constructor(message, code = "SCHEMA_ERROR", details = null) {
    super(message);
    this.name = "SchemaException";
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SchemaException);
    }
  }

  /**
   * Create exception for invalid column type
   */
  static invalidColumnType(columnName, type) {
    return new SchemaException(
      `Invalid column type '${type}' for column '${columnName}'`,
      "INVALID_COLUMN_TYPE",
      { columnName, type }
    );
  }

  /**
   * Create exception for invalid column length
   */
  static invalidColumnLength(columnName, length) {
    return new SchemaException(
      `Invalid column length '${length}' for column '${columnName}'`,
      "INVALID_COLUMN_LENGTH",
      { columnName, length }
    );
  }

  /**
   * Create exception for invalid enum values
   */
  static invalidEnumValues(columnName, values) {
    return new SchemaException(
      `Invalid enum values for column '${columnName}': ${JSON.stringify(values)}`,
      "INVALID_ENUM_VALUES",
      { columnName, values }
    );
  }

  /**
   * Create exception for invalid foreign key reference
   */
  static invalidForeignKeyReference(
    columnName,
    referencedTable,
    referencedColumn
  ) {
    return new SchemaException(
      `Invalid foreign key reference for column '${columnName}': ${referencedTable}.${referencedColumn}`,
      "INVALID_FOREIGN_KEY_REFERENCE",
      { columnName, referencedTable, referencedColumn }
    );
  }

  /**
   * Create exception for invalid index definition
   */
  static invalidIndexDefinition(indexName, columns) {
    return new SchemaException(
      `Invalid index definition '${indexName}' with columns: ${JSON.stringify(columns)}`,
      "INVALID_INDEX_DEFINITION",
      { indexName, columns }
    );
  }

  /**
   * Create exception for circular foreign key dependency
   */
  static circularDependency(tables) {
    return new SchemaException(
      `Circular foreign key dependency detected: ${tables.join(" -> ")}`,
      "CIRCULAR_DEPENDENCY",
      { tables }
    );
  }

  /**
   * Create exception for missing primary key
   */
  static missingPrimaryKey(tableName) {
    return new SchemaException(
      `Table '${tableName}' must have a primary key`,
      "MISSING_PRIMARY_KEY",
      { tableName }
    );
  }

  /**
   * Create exception for multiple primary keys
   */
  static multiplePrimaryKeys(tableName, columns) {
    return new SchemaException(
      `Table '${tableName}' cannot have multiple primary keys: ${columns.join(", ")}`,
      "MULTIPLE_PRIMARY_KEYS",
      { tableName, columns }
    );
  }

  /**
   * Create exception for invalid table name
   */
  static invalidTableName(tableName) {
    return new SchemaException(
      `Invalid table name: '${tableName}'. Table names must be valid identifiers`,
      "INVALID_TABLE_NAME",
      { tableName }
    );
  }

  /**
   * Create exception for invalid column name
   */
  static invalidColumnName(columnName) {
    return new SchemaException(
      `Invalid column name: '${columnName}'. Column names must be valid identifiers`,
      "INVALID_COLUMN_NAME",
      { columnName }
    );
  }

  /**
   * Create exception for reserved keyword usage
   */
  static reservedKeyword(name, type = "identifier") {
    return new SchemaException(
      `'${name}' is a reserved keyword and cannot be used as ${type}`,
      "RESERVED_KEYWORD",
      { name, type }
    );
  }

  /**
   * Create exception for incompatible column modification
   */
  static incompatibleModification(tableName, columnName, fromType, toType) {
    return new SchemaException(
      `Cannot modify column '${columnName}' in table '${tableName}' from '${fromType}' to '${toType}': incompatible types`,
      "INCOMPATIBLE_MODIFICATION",
      { tableName, columnName, fromType, toType }
    );
  }

  /**
   * Create exception for blueprint validation failure
   */
  static blueprintValidationFailed(tableName, errors) {
    return new SchemaException(
      `Blueprint validation failed for table '${tableName}': ${errors.join(", ")}`,
      "BLUEPRINT_VALIDATION_FAILED",
      { tableName, errors }
    );
  }

  /**
   * Get formatted error message for logging
   */
  getFormattedMessage() {
    return {
      error: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }

  /**
   * Convert to JSON for API responses
   */
  toJSON() {
    return {
      error: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}

module.exports = SchemaException;
