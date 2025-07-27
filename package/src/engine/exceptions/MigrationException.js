class MigrationException extends Error {
  constructor(message, code = "MIGRATION_ERROR", details = null) {
    super(message);
    this.name = "MigrationException";
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MigrationException);
    }
  }

  /**
   * Create exception for table already exists
   */
  static tableAlreadyExists(tableName) {
    return new MigrationException(
      `Table '${tableName}' already exists`,
      "TABLE_EXISTS",
      { tableName }
    );
  }

  /**
   * Create exception for table not found
   */
  static tableNotFound(tableName) {
    return new MigrationException(
      `Table '${tableName}' does not exist`,
      "TABLE_NOT_FOUND",
      { tableName }
    );
  }

  /**
   * Create exception for column already exists
   */
  static columnAlreadyExists(tableName, columnName) {
    return new MigrationException(
      `Column '${columnName}' already exists in table '${tableName}'`,
      "COLUMN_EXISTS",
      { tableName, columnName }
    );
  }

  /**
   * Create exception for column not found
   */
  static columnNotFound(tableName, columnName) {
    return new MigrationException(
      `Column '${columnName}' does not exist in table '${tableName}'`,
      "COLUMN_NOT_FOUND",
      { tableName, columnName }
    );
  }

  /**
   * Create exception for invalid migration direction
   */
  static invalidDirection(direction) {
    return new MigrationException(
      `Invalid migration direction: '${direction}'. Must be 'up' or 'down'`,
      "INVALID_DIRECTION",
      { direction }
    );
  }

  /**
   * Create exception for migration file not found
   */
  static migrationFileNotFound(fileName) {
    return new MigrationException(
      `Migration file not found: '${fileName}'`,
      "MIGRATION_FILE_NOT_FOUND",
      { fileName }
    );
  }

  /**
   * Create exception for foreign key constraint violation
   */
  static foreignKeyViolation(tableName, columnName, referencedTable) {
    return new MigrationException(
      `Foreign key constraint violation in table '${tableName}', column '${columnName}' referencing '${referencedTable}'`,
      "FOREIGN_KEY_VIOLATION",
      { tableName, columnName, referencedTable }
    );
  }

  /**
   * Create exception for index already exists
   */
  static indexAlreadyExists(indexName, tableName) {
    return new MigrationException(
      `Index '${indexName}' already exists on table '${tableName}'`,
      "INDEX_EXISTS",
      { indexName, tableName }
    );
  }

  /**
   * Create exception for index not found
   */
  static indexNotFound(indexName, tableName) {
    return new MigrationException(
      `Index '${indexName}' does not exist on table '${tableName}'`,
      "INDEX_NOT_FOUND",
      { indexName, tableName }
    );
  }

  /**
   * Create exception for rollback failure
   */
  static rollbackFailed(migrationName, originalError) {
    return new MigrationException(
      `Failed to rollback migration '${migrationName}': ${originalError.message}`,
      "ROLLBACK_FAILED",
      { migrationName, originalError: originalError.message }
    );
  }

  /**
   * Create exception for database connection error
   */
  static connectionError(details) {
    return new MigrationException(
      "Database connection error during migration",
      "CONNECTION_ERROR",
      details
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

module.exports = MigrationException;
