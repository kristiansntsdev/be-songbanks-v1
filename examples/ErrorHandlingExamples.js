/**
 * Error Handling Examples for Swagpress Framework
 * 
 * This file demonstrates how to use the new Laravel-inspired error handling system.
 * Replace old ErrorController.* calls with throwing custom exceptions.
 */

const ErrorHandler = require('../app/middleware/ErrorHandler');
const {
    ValidationException,
    BadRequestException,
    UnauthorizedException,
    ForbiddenException,
    NotFoundException,
    ConflictException,
    AuthenticationException,
    AccountAccessDeniedException,
    ModelNotFoundException,
    DuplicateResourceException
} = require('../package/swagpress');

class ErrorHandlingExamples {
    /**
     * OLD WAY (Don't use anymore):
     * return ErrorController.badRequest(res, 'Email is required');
     * 
     * NEW WAY:
     * throw ValidationException.required('email');
     */
    
    // Example 1: Validation Errors
    static exampleValidation = ErrorHandler.asyncHandler(async (req, res) => {
        const { email, password, name } = req.body;
        
        // Single field validation
        if (!email) {
            throw ValidationException.required('email');
        }
        
        // Multiple field validation
        const validation = new ValidationException('Multiple validation errors');
        if (!email) validation.addError('email', 'Email is required');
        if (!password) validation.addError('password', 'Password is required');
        if (!name) validation.addError('name', 'Name is required');
        
        if (validation.errors.length > 0) {
            throw validation;
        }
        
        // Email format validation
        if (!/\S+@\S+\.\S+/.test(email)) {
            throw ValidationException.invalid('email', 'must be a valid email address');
        }
        
        res.json({ code: 200, message: 'Validation passed' });
    });

    // Example 2: Authentication Errors
    static exampleAuth = ErrorHandler.asyncHandler(async (req, res) => {
        // OLD: ErrorController.unauthorized(res, 'Invalid credentials');
        // NEW:
        throw new AuthenticationException('Invalid credentials');
        
        // For token errors:
        // throw new AuthenticationException('Token expired');
        // throw new AuthenticationException('Invalid token');
    });

    // Example 3: Not Found Errors
    static exampleNotFound = ErrorHandler.asyncHandler(async (req, res) => {
        const { userId } = req.params;
        
        // OLD: ErrorController.notFound(req, res);
        // NEW:
        throw new ModelNotFoundException('User', userId);
        
        // Or generic not found:
        // throw new NotFoundException('Resource not found');
    });

    // Example 4: Forbidden/Permission Errors
    static exampleForbidden = ErrorHandler.asyncHandler(async (req, res) => {
        // OLD: ErrorController.forbidden(res, 'Admin access required');
        // NEW:
        throw new ForbiddenException('Admin access required');
        
        // For account status issues:
        // throw new AccountAccessDeniedException('suspended');
    });

    // Example 5: Conflict/Duplicate Errors
    static exampleConflict = ErrorHandler.asyncHandler(async (req, res) => {
        // OLD: ErrorController.conflict(res, 'Email already exists');
        // NEW:
        throw new DuplicateResourceException('User', 'email');
        
        // Or generic conflict:
        // throw new ConflictException('Resource already exists');
    });

    // Example 6: Custom Business Logic Errors
    static exampleBusiness = ErrorHandler.asyncHandler(async (req, res) => {
        const user = { status: 'pending', credits: 0 };
        
        // Account status check
        if (user.status !== 'active') {
            throw new AccountAccessDeniedException(user.status);
        }
        
        // Business rule validation
        if (user.credits < 10) {
            throw new BadRequestException('Insufficient credits to perform this action');
        }
        
        res.json({ code: 200, message: 'Action completed' });
    });

    // Example 7: Helper Methods for Common Validations
    static exampleHelpers = ErrorHandler.asyncHandler(async (req, res) => {
        const { email, password } = req.body;
        
        // Use ErrorHandler helpers for quick validations
        ErrorHandler.validateRequired(['email', 'password'], req.body);
        
        // Or throw specific validations
        if (!email.includes('@')) {
            ErrorHandler.throwValidation('email', 'must be a valid email address');
        }
        
        res.json({ code: 200, message: 'Helpers work great!' });
    });

    // Example 8: Service Layer Error Handling
    static async exampleService(userData) {
        // In services, just throw exceptions - they'll be caught by middleware
        
        if (!userData.email) {
            throw ValidationException.required('email');
        }
        
        const existingUser = await User.findOne({ where: { email: userData.email } });
        if (existingUser) {
            throw new DuplicateResourceException('User', 'email');
        }
        
        // Business logic
        if (userData.age < 18) {
            throw new BadRequestException('Users must be at least 18 years old');
        }
        
        return await User.create(userData);
    }
}

/**
 * MIGRATION GUIDE:
 * 
 * 1. Replace ErrorController static methods:
 *    ErrorController.badRequest(res, message) → throw new BadRequestException(message)
 *    ErrorController.unauthorized(res, message) → throw new UnauthorizedException(message)
 *    ErrorController.forbidden(res, message) → throw new ForbiddenException(message)
 *    ErrorController.notFound(req, res) → throw new NotFoundException()
 *    ErrorController.conflict(res, message) → throw new ConflictException(message)
 *    ErrorController.validationError(res, errors) → throw new ValidationException(message, errors)
 * 
 * 2. Wrap controller methods with ErrorHandler.asyncHandler()
 * 
 * 3. Remove try/catch blocks from controllers - let middleware handle errors
 * 
 * 4. In services, throw exceptions directly - no need for try/catch
 * 
 * 5. Use helper methods for common patterns:
 *    ErrorHandler.validateRequired(['field1', 'field2'], data)
 *    ErrorHandler.throwNotFound('User', id)
 *    ErrorHandler.throwUnauthorized('Custom message')
 */

module.exports = ErrorHandlingExamples;