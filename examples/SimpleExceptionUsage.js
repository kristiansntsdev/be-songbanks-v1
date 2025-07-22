/**
 * Simple Exception Usage Examples
 * 
 * Shows how to use the new exception system in the simplest way possible.
 */

// Import exceptions from the framework
const {
    AuthenticationException,
    ValidationException,
    ModelNotFoundException,
    BadRequestException,
    ForbiddenException
} = require('../package/swagpress');

const ErrorHandler = require('../app/middleware/ErrorHandler');

class SimpleExamples {
    
    // Example 1: Simple validation
    static validateUser = ErrorHandler.asyncHandler(async (req, res) => {
        const { email, password } = req.body;
        
        // Just throw the exception - middleware will handle it
        if (!email) {
            throw ValidationException.required('email');
        }
        
        if (!password) {
            throw ValidationException.required('password');
        }
        
        res.json({ code: 200, message: 'Validation passed' });
    });

    // Example 2: Authentication
    static login = ErrorHandler.asyncHandler(async (req, res) => {
        const { email, password } = req.body;
        
        // Simulate user lookup
        const user = null; // await User.findOne({ where: { email } });
        
        if (!user) {
            throw new AuthenticationException('Invalid credentials');
        }
        
        res.json({ code: 200, message: 'Login successful' });
    });

    // Example 3: Not found
    static getUser = ErrorHandler.asyncHandler(async (req, res) => {
        const { userId } = req.params;
        
        // Simulate user lookup
        const user = null; // await User.findByPk(userId);
        
        if (!user) {
            throw new ModelNotFoundException('User', userId);
        }
        
        res.json({ code: 200, data: user });
    });

    // Example 4: Business logic validation
    static updateProfile = ErrorHandler.asyncHandler(async (req, res) => {
        const { age } = req.body;
        
        if (age < 18) {
            throw new BadRequestException('Users must be at least 18 years old');
        }
        
        res.json({ code: 200, message: 'Profile updated' });
    });

    // Example 5: Permission check
    static deleteUser = ErrorHandler.asyncHandler(async (req, res) => {
        const isAdmin = false; // req.user?.role === 'admin';
        
        if (!isAdmin) {
            throw new ForbiddenException('Admin access required');
        }
        
        res.json({ code: 200, message: 'User deleted' });
    });
}

/**
 * USAGE SUMMARY:
 * 
 * 1. Import exceptions: const { AuthenticationException } = require('../swagpress');
 * 
 * 2. Wrap controller methods: ErrorHandler.asyncHandler(async (req, res) => { ... });
 * 
 * 3. Throw exceptions: throw new AuthenticationException('Invalid credentials');
 * 
 * 4. No try/catch needed - middleware handles everything!
 * 
 * 5. All exceptions return consistent format:
 *    {
 *      "code": 401,
 *      "message": "Invalid credentials"
 *    }
 */

module.exports = SimpleExamples;