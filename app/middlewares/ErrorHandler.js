import { BaseException } from "../../package/swagpress.js";

class ErrorHandler {
  /**
   * Express error handling middleware
   * @param {Error} err - Error object
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {Function} next - Express next function
   */
  static handle(err, req, res, next) {
    // Log error for debugging
    console.error("Error caught by ErrorHandler:", {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });

    // Handle custom application exceptions
    if (err instanceof BaseException) {
      return res.status(err.statusCode).json(err.toSwagpressResponse());
    }

    // Handle Sequelize validation errors
    if (err.name === "SequelizeValidationError") {
      const errors = err.errors.map((error) => ({
        field: error.path,
        message: error.message,
      }));

      return res.status(422).json({
        code: 422,
        message: "Validation failed",
        errors: errors,
      });
    }

    // Handle Sequelize unique constraint errors
    if (err.name === "SequelizeUniqueConstraintError") {
      const field = err.errors[0]?.path || "field";
      return res.status(409).json({
        code: 409,
        message: `${field} already exists`,
      });
    }

    // Handle Sequelize foreign key constraint errors
    if (err.name === "SequelizeForeignKeyConstraintError") {
      return res.status(400).json({
        code: 400,
        message: "Invalid reference - related resource not found",
      });
    }

    // Handle JWT errors
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        code: 401,
        message: "Invalid token",
      });
    }

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        code: 401,
        message: "Token expired",
      });
    }

    // Handle syntax errors (malformed JSON)
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
      return res.status(400).json({
        code: 400,
        message: "Invalid JSON in request body",
      });
    }

    // Handle other known error types
    if (err.status || err.statusCode) {
      const statusCode = err.status || err.statusCode;
      return res.status(statusCode).json({
        code: statusCode,
        message: err.message || "An error occurred",
      });
    }

    // Default to 500 for unknown errors
    const statusCode = process.env.NODE_ENV === "production" ? 500 : 500;
    const message =
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message || "An unexpected error occurred";

    res.status(statusCode).json({
      code: statusCode,
      message: message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }

  /**
   * 404 Not Found handler
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  static notFound(req, res) {
    res.status(404).json({
      code: 404,
      message: `Route ${req.method} ${req.originalUrl} not found`,
    });
  }

  /**
   * Async wrapper to catch async/await errors
   * @param {Function} fn - Async function to wrap
   * @returns {Function} Express middleware function
   */
  static asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * Create a validation error for missing required fields
   * @param {Array} requiredFields - Array of required field names
   * @param {Object} data - Data object to validate
   * @throws {ValidationException} If validation fails
   */
  static async validateRequired(requiredFields, data) {
    const { ValidationException } = await import("../../package/swagpress.js");
    const validation = new ValidationException();
    let hasErrors = false;

    requiredFields.forEach((field) => {
      if (!data[field] || data[field] === "") {
        validation.addError(field, `${field} is required`);
        hasErrors = true;
      }
    });

    if (hasErrors) {
      throw validation;
    }
  }

  /**
   * Helper to throw a validation error for a specific field
   * @param {string} field - Field name
   * @param {string} message - Error message
   * @throws {ValidationException}
   */
  static async throwValidation(field, message) {
    const { ValidationException } = await import("../../package/swagpress.js");
    throw ValidationException.field(field, message);
  }

  /**
   * Helper to throw a not found error
   * @param {string} resource - Resource name
   * @param {string} id - Resource ID (optional)
   * @throws {ModelNotFoundException}
   */
  static async throwNotFound(resource, id = null) {
    const { ModelNotFoundException } = await import(
      "../../package/swagpress.js"
    );
    throw new ModelNotFoundException(resource, id);
  }

  /**
   * Helper to throw an unauthorized error
   * @param {string} message - Error message
   * @throws {UnauthorizedException}
   */
  static async throwUnauthorized(message = "Unauthorized") {
    const { UnauthorizedException } = await import(
      "../../package/swagpress.js"
    );
    throw new UnauthorizedException(message);
  }

  /**
   * Helper to throw a forbidden error
   * @param {string} message - Error message
   * @throws {ForbiddenException}
   */
  static async throwForbidden(message = "Forbidden") {
    const { ForbiddenException } = await import("../../package/swagpress.js");
    throw new ForbiddenException(message);
  }
}

export default ErrorHandler;
