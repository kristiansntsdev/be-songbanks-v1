class SeederException extends Error {
    constructor(message, code = 'SEEDER_ERROR', details = null) {
        super(message);
        this.name = 'SeederException';
        this.code = code;
        this.details = details;
        this.timestamp = new Date().toISOString();
        
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, SeederException);
        }
    }

    /**
     * Create exception for factory not found
     */
    static factoryNotFound(modelName) {
        return new SeederException(
            `Factory for model '${modelName}' not found`,
            'FACTORY_NOT_FOUND',
            { modelName }
        );
    }

    /**
     * Create exception for duplicate entry
     */
    static duplicateEntry(tableName, field, value) {
        return new SeederException(
            `Duplicate entry '${value}' for field '${field}' in table '${tableName}'`,
            'DUPLICATE_ENTRY',
            { tableName, field, value }
        );
    }

    /**
     * Create exception for invalid data
     */
    static invalidData(modelName, errors) {
        return new SeederException(
            `Invalid data for model '${modelName}': ${errors.join(', ')}`,
            'INVALID_DATA',
            { modelName, errors }
        );
    }

    /**
     * Create exception for seeding failure
     */
    static seedingFailed(seederName, originalError) {
        return new SeederException(
            `Seeding failed in '${seederName}': ${originalError.message}`,
            'SEEDING_FAILED',
            { seederName, originalError: originalError.message }
        );
    }

    /**
     * Create exception for rollback failure
     */
    static rollbackFailed(seederName, originalError) {
        return new SeederException(
            `Rollback failed in '${seederName}': ${originalError.message}`,
            'ROLLBACK_FAILED',
            { seederName, originalError: originalError.message }
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
            stack: this.stack
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
            timestamp: this.timestamp
        };
    }
}

module.exports = SeederException;