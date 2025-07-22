const AuthService = require('../services/AuthService');
const ErrorHandler = require('../middleware/ErrorHandler');

class AuthController {
    /**
     * POST /api/auth/login
     * @summary User login
     * @description Authenticate user with email and password
     * @body {loginData: object}
     * @returns {user: object, token: string}
     */
    static apiLogin = ErrorHandler.asyncHandler(async (req, res) => {
        const { email, password } = req.body;
        
        const result = await AuthService.login(email, password);
        
        res.json({
            code: 200,
            message: result.message,
            data: {
                token: result.token,
                user: result.user
            }
        });
    });

    /**
     * POST /api/auth/logout
     * @summary User logout
     * @description Logout authenticated user
     * @returns {message: string}
     */
    static apiLogout = ErrorHandler.asyncHandler(async (req, res) => {
        res.json({
            code: 200,
            message: 'Logout successful'
        });
    });
}

module.exports = AuthController;