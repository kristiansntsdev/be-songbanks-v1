const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { 
    AuthenticationException, 
    AccountAccessDeniedException, 
    ModelNotFoundException,
    ValidationException 
} = require('../../package/swagpress');

class AuthService {
    static async login(email, password) {
        this.validateLoginInput(email, password);
        
        const user = await User.scope('withPassword')
            .where('email', email)
            .first();
            
        if (!user) throw new AuthenticationException('Invalid credentials');
        
        this.validateUserStatus(user);
        this.validatePassword(user.password, password);
        
        const token = this.generateToken(user);
        const userResponse = this.sanitizeUser(user);
        
        return { user: userResponse, token, message: 'Login successful' };
    }

    static async verifyToken(token) {
        try {
            const decoded = jwt.verify(token, process.env.SESSION_SECRET);
            const user = await User.findByPk(decoded.userId);
            
            if (!user) throw new ModelNotFoundException('User', decoded.userId);
            this.validateUserStatus(user);
            
            return user;
        } catch (error) {
            this.handleTokenError(error);
        }
    }

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

    static async refreshToken(userId) {
        const user = await User.findByPk(userId);
        if (!user) throw new ModelNotFoundException('User', userId);
        
        this.validateUserStatus(user);
        const token = this.generateToken(user);
        
        return { token, message: 'Token refreshed successfully' };
    }

    static validateLoginInput(email, password) {
        if (!email) throw ValidationException.required('email');
        if (!password) throw ValidationException.required('password');
    }

    static validateUserStatus(user) {
        if (user.status !== 'active') {
            throw new AccountAccessDeniedException(user.status);
        }
    }

    static validatePassword(userPassword, inputPassword) {
        if (userPassword !== inputPassword) {
            throw new AuthenticationException('Invalid credentials');
        }
    }

    static sanitizeUser(user) {
        const userResponse = user.toJSON();
        delete userResponse.password;
        return userResponse;
    }

    static handleTokenError(error) {
        if (error.name === 'TokenExpiredError') {
            throw new AuthenticationException('Token expired');
        }
        if (error.name === 'JsonWebTokenError') {
            throw new AuthenticationException('Invalid token');
        }
        throw error;
    }
}

module.exports = AuthService;