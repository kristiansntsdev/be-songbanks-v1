const BaseException = require('./BaseException');

class ValidationException extends BaseException {
    constructor(message = 'Validation failed', errors = []) {
        super(message, 422, 'Validation Error');
        this.errors = errors;
    }

    /**
     * Convert exception to JSON response format
     * @returns {Object} JSON response object
     */
    toResponse() {
        return {
            error: this.errorType,
            message: this.message,
            errors: this.errors,
            statusCode: this.statusCode
        };
    }

    /**
     * Convert exception to Swagpress standard format
     * @returns {Object} Swagpress response format
     */
    toSwagpressResponse() {
        return {
            code: this.statusCode,
            message: this.message,
            errors: this.errors
        };
    }

    /**
     * Add validation error
     * @param {string} field - Field name
     * @param {string} message - Error message
     * @returns {ValidationException} This instance for chaining
     */
    addError(field, message) {
        this.errors.push({ field, message });
        return this;
    }

    /**
     * Static factory method for field validation
     * @param {string} field - Field name
     * @param {string} message - Error message
     * @returns {ValidationException} New validation exception
     */
    static field(field, message) {
        const exception = new ValidationException('Validation failed');
        return exception.addError(field, message);
    }

    /**
     * Static factory method for required field
     * @param {string} field - Field name
     * @returns {ValidationException} New validation exception
     */
    static required(field) {
        return ValidationException.field(field, `${field} is required`);
    }

    /**
     * Static factory method for invalid field
     * @param {string} field - Field name
     * @param {string} reason - Reason for invalidity
     * @returns {ValidationException} New validation exception
     */
    static invalid(field, reason = 'is invalid') {
        return ValidationException.field(field, `${field} ${reason}`);
    }
}

module.exports = ValidationException;