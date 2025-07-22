const jwt = require('jsonwebtoken');
const { UnauthorizedException } = require('../../package/swagpress');

const JWT_SECRET = process.env.SESSION_SECRET || 'your-secret-key';

const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            throw new UnauthorizedException('Access token required');
        }

        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                return next(new UnauthorizedException('Invalid or expired token'));
            }
            req.user = user;
            next();
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { authenticateToken };