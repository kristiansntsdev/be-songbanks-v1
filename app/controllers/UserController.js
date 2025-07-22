const User = require('../models/User');
const ErrorHandler = require('../middleware/ErrorHandler');
const { NotFoundException, BadRequestException } = require('../../package/swagpress');

class UserController {
    /**
     * GET /api/admin/user-access
     * @summary Get user access management data
     * @returns {active_users: array, request_users: array, suspended_users: array}
     */
    static getUserAccess = ErrorHandler.asyncHandler(async (req, res) => {
        const activeUsers = await User.findAll({
            where: {
                status: ['active']
            },
            attributes: ['id', 'email', 'role', 'status']
        });

        const requestUsers = await User.findAll({
            where: {
                status: ['request']
            },
            attributes: ['id', 'email', 'role', 'status']
        });

        const suspendedUsers = await User.findAll({
            where: {
                status: ['suspend']
            },
            attributes: ['id', 'email', 'role', 'status']
        });

        res.json({
            code: 200,
            message: 'User access list retrieved successfully',
            data: {
                "active_users": activeUsers.filter(user => user.role !== 'admin').map(user => ({
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    status: user.status
                })),
                "request_users": requestUsers.map(user => ({
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    status: user.status
                })),
                "suspended_users": suspendedUsers.map(user => ({
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    status: user.status
                }))
            }
        });
    });

    /**
     * PUT /api/admin/user-access/:user_id
     * @summary Update user access status
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

        const user = await User.findByPk(user_id);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        await user.update({ status });

        res.json({
            code: 200,
            message: 'User access updated successfully',
            data: {
                id: user.id,
                status: user.status
            }
        });
    });
}

module.exports = UserController;