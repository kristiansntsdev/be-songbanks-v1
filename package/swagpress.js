/**
 * Swagpress Framework - Main entry point
 * 
 * This file provides easy access to all Swagpress framework features.
 * Import this file to get access to all exceptions, models, and utilities.
 */

// Re-export everything from the engine
module.exports = require('./src/engine');

// Add convenient aliases for the most commonly used exceptions
const {
    ValidationException,
    AuthenticationException,
    BadRequestException,
    UnauthorizedException,
    ForbiddenException,
    NotFoundException,
    ModelNotFoundException,
    AccountAccessDeniedException,
    DuplicateResourceException,
    ConflictException
} = require('./src/engine');

// Export the most commonly used exceptions as named exports for convenience
module.exports.ValidationException = ValidationException;
module.exports.AuthenticationException = AuthenticationException;
module.exports.BadRequestException = BadRequestException;
module.exports.UnauthorizedException = UnauthorizedException;
module.exports.ForbiddenException = ForbiddenException;
module.exports.NotFoundException = NotFoundException;
module.exports.ModelNotFoundException = ModelNotFoundException;
module.exports.AccountAccessDeniedException = AccountAccessDeniedException;
module.exports.DuplicateResourceException = DuplicateResourceException;
module.exports.ConflictException = ConflictException;