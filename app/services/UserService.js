const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Note = require('../models/Note');

class UserService {
    static async changeUserStatus(userId, status, adminId) {
        await this.validateAdminPermission(adminId);
        const user = await this.validateUserExists(userId);
        
        this.validateUserStatus(status);
        await user.update({ status });

        return {
            user,
            message: `User status changed to ${status}`
        };
    }

    // Helper methods
    static async validateAdminPermission(adminId) {
        const admin = await User.findByPk(adminId);
        if (!admin || admin.role !== 'admin') {
            throw new Error('Unauthorized: Admin access required');
        }
        return admin;
    }

    static async validateUserExists(userId) {
        const user = await User.findByPk(userId);
        if (!user) throw new Error('User not found');
        return user;
    }

    static async ensureUserEmailUnique(email) {
        const existing = await User.query()
            .where('email', email)
            .first();
        
        if (existing) {
            throw new Error('User already exists with this email');
        }
    }

    static async validateUpdatePermission(userId, requesterId, requester) {
        if (userId !== requesterId && requester.role !== 'admin') {
            throw new Error('Unauthorized: Can only update your own profile');
        }
    }

    static validateUserStatus(status) {
        const validStatuses = ['active', 'inactive', 'suspended'];
        if (!validStatuses.includes(status)) {
            throw new Error('Invalid status. Must be: active, inactive, or suspended');
        }
    }

    static async hashPassword(password) {
        const saltRounds = 10;
        return bcrypt.hash(password, saltRounds);
    }

    static paginatedResponse(rows, count, page, limit, key = 'items') {
        return {
            [key]: rows,
            pagination: this.buildPagination(count, page, limit)
        };
    }

    static buildPagination(count, page, limit) {
        return {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit),
            hasNextPage: page * limit < count,
            hasPrevPage: page > 1
        };
    }

    static async getUserAccess() {
        const [activeUsers, requestUsers, suspendedUsers] = await Promise.all([
            User.query().where('status', 'active').get(),
            User.query().where('status', 'request').get(),
            User.query().where('status', 'suspend').get()
        ]);

        return {
            active_users: activeUsers.filter(user => user.role !== 'admin').map(user => ({
                id: user.id,
                email: user.email,
                role: user.role,
                status: user.status
            })),
            request_users: requestUsers.map(user => ({
                id: user.id,
                email: user.email,
                role: user.role,
                status: user.status
            })),
            suspended_users: suspendedUsers.map(user => ({
                id: user.id,
                email: user.email,
                role: user.role,
                status: user.status
            }))
        };
    }
}

module.exports = UserService;