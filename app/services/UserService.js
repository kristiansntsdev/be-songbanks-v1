const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Note = require('../models/Note');

class UserService {
    /**
     * Get all users with pagination and filters
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Paginated users
     */
    static async getAllUsers(options = {}) {
        try {
            const {
                page = 1,
                limit = 10,
                search,
                role,
                status,
                sortBy = 'createdAt',
                sortOrder = 'DESC'
            } = options;

            const offset = (page - 1) * limit;
            const where = {};

            // Add search filter
            if (search) {
                where[Op.or] = [
                    { email: { [Op.like]: `%${search}%` } },
                    { first_name: { [Op.like]: `%${search}%` } },
                    { last_name: { [Op.like]: `%${search}%` } }
                ];
            }

            // Add role filter
            if (role) {
                where.role = role;
            }

            // Add status filter
            if (status) {
                where.status = status;
            }

            const { count, rows } = await User.findAndCountAll({
                where,
                include: [
                    {
                        model: Note,
                        as: 'notes',
                        attributes: ['id', 'content', 'song_id', 'createdAt']
                    }
                ],
                limit: parseInt(limit),
                offset,
                order: [[sortBy, sortOrder]]
            });

            return {
                users: rows,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(count / limit),
                    totalItems: count,
                    itemsPerPage: parseInt(limit),
                    hasNextPage: page * limit < count,
                    hasPrevPage: page > 1
                }
            };
        } catch (error) {
            throw new Error(`Failed to retrieve users: ${error.message}`);
        }
    }

    /**
     * Get user by ID with full details
     * @param {string} userId - User ID
     * @returns {Promise<Object>} User details
     */
    static async getUserById(userId) {
        try {
            const user = await User.findByPk(userId, {
                include: [
                    {
                        model: Note,
                        as: 'notes',
                        attributes: ['id', 'content', 'song_id', 'createdAt']
                    }
                ]
            });

            if (!user) {
                throw new Error('User not found');
            }

            return user;
        } catch (error) {
            throw new Error(`Failed to retrieve user: ${error.message}`);
        }
    }

    /**
     * Get user by email
     * @param {string} email - User email
     * @returns {Promise<Object>} User details
     */
    static async getUserByEmail(email) {
        try {
            const user = await User.findOne({
                where: { email },
                include: [
                    {
                        model: Note,
                        as: 'notes',
                        attributes: ['id', 'content', 'song_id', 'createdAt']
                    }
                ]
            });

            if (!user) {
                throw new Error('User not found');
            }

            return user;
        } catch (error) {
            throw new Error(`Failed to retrieve user: ${error.message}`);
        }
    }

    /**
     * Create a new user (admin only)
     * @param {Object} userData - User creation data
     * @param {string} adminId - Admin user ID creating the user
     * @returns {Promise<Object>} Created user
     */
    static async createUser(userData, adminId) {
        try {
            // Verify admin permissions
            const admin = await User.findByPk(adminId);
            if (!admin || admin.role !== 'admin') {
                throw new Error('Unauthorized: Admin access required');
            }

            // Check if user already exists
            const existingUser = await User.findOne({
                where: { email: userData.email }
            });

            if (existingUser) {
                throw new Error('User already exists with this email');
            }

            // Hash password if provided
            let hashedPassword;
            if (userData.password) {
                const saltRounds = 10;
                hashedPassword = await bcrypt.hash(userData.password, saltRounds);
            }

            // Create user
            const user = await User.create({
                ...userData,
                password: hashedPassword,
                role: userData.role || 'member',
                status: userData.status || 'active'
            });

            return user;
        } catch (error) {
            throw new Error(`Failed to create user: ${error.message}`);
        }
    }

    /**
     * Update user information
     * @param {string} userId - User ID to update
     * @param {Object} updateData - Update data
     * @param {string} requesterId - User ID making the request
     * @returns {Promise<Object>} Updated user
     */
    static async updateUser(userId, updateData, requesterId) {
        try {
            const user = await User.findByPk(userId);
            if (!user) {
                throw new Error('User not found');
            }

            const requester = await User.findByPk(requesterId);
            if (!requester) {
                throw new Error('Requester not found');
            }

            // Check permissions: users can update themselves, admins can update anyone
            if (userId !== requesterId && requester.role !== 'admin') {
                throw new Error('Unauthorized: Can only update your own profile');
            }

            // Restrict role changes to admins only
            if (updateData.role && requester.role !== 'admin') {
                throw new Error('Unauthorized: Cannot change user role');
            }

            // Remove password from regular updates (use separate method)
            const { password, ...allowedUpdates } = updateData;

            await user.update(allowedUpdates);

            return user;
        } catch (error) {
            throw new Error(`Failed to update user: ${error.message}`);
        }
    }

    /**
     * Update user password
     * @param {string} userId - User ID
     * @param {string} newPassword - New password
     * @param {string} requesterId - User ID making the request
     * @returns {Promise<Object>} Success message
     */
    static async updatePassword(userId, newPassword, requesterId) {
        try {
            const user = await User.findByPk(userId);
            if (!user) {
                throw new Error('User not found');
            }

            const requester = await User.findByPk(requesterId);
            if (!requester) {
                throw new Error('Requester not found');
            }

            // Check permissions
            if (userId !== requesterId && requester.role !== 'admin') {
                throw new Error('Unauthorized: Can only change your own password');
            }

            // Hash new password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

            await user.update({ password: hashedPassword });

            return {
                message: 'Password updated successfully'
            };
        } catch (error) {
            throw new Error(`Failed to update password: ${error.message}`);
        }
    }

    /**
     * Delete user (admin only)
     * @param {string} userId - User ID to delete
     * @param {string} adminId - Admin user ID
     * @returns {Promise<Object>} Success message
     */
    static async deleteUser(userId, adminId) {
        try {
            // Verify admin permissions
            const admin = await User.findByPk(adminId);
            if (!admin || admin.role !== 'admin') {
                throw new Error('Unauthorized: Admin access required');
            }

            const user = await User.findByPk(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Prevent admin from deleting themselves
            if (userId === adminId) {
                throw new Error('Cannot delete your own account');
            }

            await user.destroy();

            return {
                message: 'User deleted successfully'
            };
        } catch (error) {
            throw new Error(`Failed to delete user: ${error.message}`);
        }
    }

    /**
     * Change user status (admin only)
     * @param {string} userId - User ID
     * @param {string} status - New status (active, inactive, suspended)
     * @param {string} adminId - Admin user ID
     * @returns {Promise<Object>} Updated user
     */
    static async changeUserStatus(userId, status, adminId) {
        try {
            // Verify admin permissions
            const admin = await User.findByPk(adminId);
            if (!admin || admin.role !== 'admin') {
                throw new Error('Unauthorized: Admin access required');
            }

            const user = await User.findByPk(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Validate status
            const validStatuses = ['active', 'inactive', 'suspended'];
            if (!validStatuses.includes(status)) {
                throw new Error('Invalid status. Must be: active, inactive, or suspended');
            }

            await user.update({ status });

            return {
                user,
                message: `User status changed to ${status}`
            };
        } catch (error) {
            throw new Error(`Failed to change user status: ${error.message}`);
        }
    }

    /**
     * Get users by role
     * @param {string} role - User role
     * @returns {Promise<Array>} Users with specified role
     */
    static async getUsersByRole(role) {
        try {
            const users = await User.findAll({
                where: { role },
                order: [['createdAt', 'DESC']]
            });

            return users;
        } catch (error) {
            throw new Error(`Failed to get users by role: ${error.message}`);
        }
    }

    /**
     * Get user statistics
     * @returns {Promise<Object>} User statistics
     */
    static async getUserStats() {
        try {
            const totalUsers = await User.count();
            const activeUsers = await User.count({
                where: { status: 'active' }
            });
            const adminUsers = await User.count({
                where: { role: 'admin' }
            });
            const memberUsers = await User.count({
                where: { role: 'member' }
            });

            return {
                total: totalUsers,
                active: activeUsers,
                admins: adminUsers,
                members: memberUsers,
                inactive: totalUsers - activeUsers
            };
        } catch (error) {
            throw new Error(`Failed to get user statistics: ${error.message}`);
        }
    }

    /**
     * Search users
     * @param {string} searchTerm - Search term
     * @returns {Promise<Array>} Matching users
     */
    static async searchUsers(searchTerm) {
        try {
            const users = await User.findAll({
                where: {
                    [Op.or]: [
                        { email: { [Op.like]: `%${searchTerm}%` } },
                        { first_name: { [Op.like]: `%${searchTerm}%` } },
                        { last_name: { [Op.like]: `%${searchTerm}%` } }
                    ]
                },
                order: [['email', 'ASC']]
            });

            return users;
        } catch (error) {
            throw new Error(`Failed to search users: ${error.message}`);
        }
    }

    /**
     * Get user profile with activity summary
     * @param {string} userId - User ID
     * @returns {Promise<Object>} User profile with stats
     */
    static async getUserProfile(userId) {
        try {
            const user = await this.getUserById(userId);
            
            // Get activity stats
            const notesCount = await Note.count({
                where: { user_id: userId }
            });

            return {
                user,
                stats: {
                    notesCount
                }
            };
        } catch (error) {
            throw new Error(`Failed to get user profile: ${error.message}`);
        }
    }
}

module.exports = UserService;