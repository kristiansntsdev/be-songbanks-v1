const User = require('../models/User');
const ErrorController = require('./ErrorController');

class UserController {
    static async getUserAccess(req, res) {
        try {
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
        } catch (error) {
            ErrorController.handleError(error, req, res);
        }
    }

    static async updateUserAccess(req, res) {
        try {
            const { user_id } = req.params;
            const { status } = req.body;

            // Validate status
            if (!['active', 'suspend'].includes(status)) {
                return res.status(400).json({
                    code: 400,
                    message: 'Invalid status. Must be either "active" or "suspend"'
                });
            }

            // Find the user
            const user = await User.findByPk(user_id);
            if (!user) {
                return res.status(404).json({
                    code: 404,
                    message: 'User not found'
                });
            }

            // Update user status
            await user.update({ status });

            res.json({
                code: 200,
                message: 'User access updated successfully',
                data: {
                    id: user.id,
                    status: user.status
                }
            });
        } catch (error) {
            ErrorController.handleError(error, req, res);
        }
    }
}

module.exports = UserController;