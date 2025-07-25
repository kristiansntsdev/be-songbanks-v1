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

}

module.exports = UserController;