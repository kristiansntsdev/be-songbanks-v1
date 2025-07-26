const UserService = require('../services/UserService');
const ErrorHandler = require('../middlewares/ErrorHandler');
const { NotFoundException, BadRequestException } = require('../../package/swagpress');

class UserController {
    /**
     * GET /api/admin/user-access
     * @summary Get user access management data
     * @group User
     * @returns {active_users: array, request_users: array, suspended_users: array}
     */
    static getUserAccess = ErrorHandler.asyncHandler(async (req, res) => {
        const result = await UserService.getUserAccess();
        
        res.json({
            code: 200,
            message: 'User access list retrieved successfully',
            data: result
        });
    });

    /**
     * PUT /api/admin/user-access/:user_id
     * @summary Update user access status
     * @group User
     * @param {string} user_id - User ID parameter
     * @body {status: string}
     * @returns {user: object}
     */
    static updateUserAccess = ErrorHandler.asyncHandler(async (req, res) => {
        const { user_id } = req.params;
        const { status } = req.body;

        ErrorHandler.validateRequired(['status'], req.body);

        if (!['active', 'suspend'].includes(status)) {
            throw new BadRequestException('Invalid status. Must be either "active" or "suspend"');
        }

        const result = await UserService.changeUserStatus(user_id, status, req.user.id);

        res.json({
            code: 200,
            message: result.message,
            data: {
                id: result.user.id,
                status: result.user.status
            }
        });
    });

    /**
     * POST /api/vol_user/request-vol-access
     * @summary Request vol_user access
     * @group User
     * @body {message: string}
     * @returns {user_id: string, status: string}
     */
    static requestVolAccess = ErrorHandler.asyncHandler(async (req, res) => {
        const { message } = req.body;
        const userId = req.user.id;

        ErrorHandler.validateRequired(['message'], req.body);

        const result = await UserService.requestVolAccess(userId, message);

        res.status(202).json({
            code: 202,
            message: 'Vol_user access request sent successfully. Awaiting admin approval.',
            data: {
                user_id: userId,
                status: result.status
            }
        });
    });

}

module.exports = UserController;