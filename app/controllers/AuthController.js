const AuthService = require('../services/AuthService');
const ErrorHandler = require('../middlewares/ErrorHandler');

class AuthController {
    /**
     * POST /api/auth/login
     * @summary User login
     * @description Authenticate user with email and password
     * @body {email: string, password: string}
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

    /**
     * POST /api/auth/verify
     * @summary Verify JWT token
     * @body {token: string}
     * @returns {user: object}
     */
    static apiVerifyToken = ErrorHandler.asyncHandler(async (req, res) => {
        const { token } = req.body;
        const user = await AuthService.verifyToken(token);
        
        res.json({
            code: 200,
            message: 'Token verified successfully',
            data: { user }
        });
    });

    /**
     * POST /api/auth/refresh
     * @summary Refresh JWT token
     * @returns {token: string}
     */
    static apiRefreshToken = ErrorHandler.asyncHandler(async (req, res) => {
        const result = await AuthService.refreshToken(req.user.id);
        
        res.json({
            code: 200,
            message: result.message,
            data: { token: result.token }
        });
    });

}

module.exports = AuthController;