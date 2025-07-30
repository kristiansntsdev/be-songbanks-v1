class BaseException extends Error {
  constructor(message, statusCode = 500, errorType = "Error") {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorType = errorType;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert exception to JSON response format
   * @returns {Object} JSON response object
   */
  toResponse() {
    return {
      error: this.errorType,
      message: this.message,
      statusCode: this.statusCode,
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
      error: this.errorType,
    };
  }
}

export default BaseException;
