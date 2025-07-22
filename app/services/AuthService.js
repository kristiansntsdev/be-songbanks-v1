const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { 
    AuthenticationException, 
    AccountAccessDeniedException, 
    ModelNotFoundException,
    ValidationException 
} = require('../../package/swagpress');

class AuthService {
    /**
     * Login user with email and password
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} User object and token
     */
    static async login(email, password) {
        // Validate required fields
        if (!email) {
            throw ValidationException.required('email');
        }
        if (!password) {
            throw ValidationException.required('password');
        }

        // Find user by email (include password for verification)
        const user = await User.scope('withPassword').findOne({
            where: { email }
        });

        if (!user) {
            throw new AuthenticationException('Invalid credentials');
        }

        // Check if user is active
        if (user.status !== 'active') {
            throw new AccountAccessDeniedException(user.status);
        }

        // Verify password (plain text comparison)
        if (user.password !== password) {
            throw new AuthenticationException('Invalid credentials');
        }

        // Generate token
        const token = this.generateToken(user);

        // Return user without password
        const userResponse = user.toJSON();
        delete userResponse.password;

        return {
            user: userResponse,
            token,
            message: 'Login successful'
        };
    }

    /**
     * Verify and decode JWT token
     * @param {string} token - JWT token
     * @returns {Promise<Object>} Decoded user data
     */
    static async verifyToken(token) {
        try {
            const decoded = jwt.verify(token, process.env.SESSION_SECRET);
            
            // Get fresh user data
            const user = await User.findByPk(decoded.userId);
            if (!user) {
                throw new ModelNotFoundException('User', decoded.userId);
            }

            if (user.status !== 'active') {
                throw new AccountAccessDeniedException(user.status);
            }

            return user;
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new AuthenticationException('Token expired');
            }
            if (error.name === 'JsonWebTokenError') {
                throw new AuthenticationException('Invalid token');
            }
            // Re-throw custom exceptions
            throw error;
        }
    }

    /**
     * Generate JWT token for user
     * @param {Object} user - User object
     * @returns {string} JWT token
     */
    static generateToken(user) {
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role
        };

        return jwt.sign(payload, process.env.SESSION_SECRET, {
            expiresIn: '24h'
        });
    }

    /**
     * Change user password
     * @param {string} userId - User ID
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Promise<Object>} Success message
     */
    static async changePassword(userId, currentPassword, newPassword) {
        // Validate required fields
        if (!currentPassword) {
            throw ValidationException.required('currentPassword');
        }
        if (!newPassword) {
            throw ValidationException.required('newPassword');
        }

        const user = await User.scope('withPassword').findByPk(userId);
        if (!user) {
            throw new ModelNotFoundException('User', userId);
        }

        // Verify current password (plain text comparison)
        if (user.password !== currentPassword) {
            throw new AuthenticationException('Current password is incorrect');
        }

        // Update password (plain text)
        await user.update({ password: newPassword });

        return {
            message: 'Password changed successfully'
        };
    }

    /**
     * Refresh user token
     * @param {string} userId - User ID
     * @returns {Promise<Object>} New token
     */
    static async refreshToken(userId) {
        const user = await User.findByPk(userId);
        if (!user) {
            throw new ModelNotFoundException('User', userId);
        }

        if (user.status !== 'active') {
            throw new AccountAccessDeniedException(user.status);
        }

        const token = this.generateToken(user);

        return {
            token,
            message: 'Token refreshed successfully'
        };
    }

    /**
     * Update user profile
     * @param {string} userId - User ID
     * @param {Object} profileData - Profile update data
     * @returns {Promise<Object>} Updated user
     */
    static async updateProfile(userId, profileData) {
        const user = await User.findByPk(userId);
        if (!user) {
            throw new ModelNotFoundException('User', userId);
        }

        // Remove sensitive fields that shouldn't be updated via this method
        const { password, role, status, ...allowedUpdates } = profileData;

        await user.update(allowedUpdates);

        return {
            user: user.toJSON(),
            message: 'Profile updated successfully'
        };
    }
}

module.exports = AuthService;