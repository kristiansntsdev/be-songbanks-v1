const jwt = require('jsonwebtoken');
const ErrorController = require('../controllers/ErrorController');

const JWT_SECRET = process.env.SESSION_SECRET || 'your-secret-key';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return ErrorController.unauthorized(res, 'Access token required');
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return ErrorController.unauthorized(res, 'Invalid or expired token');
        }
        req.user = user;
        next();
    });
};

module.exports = { authenticateToken };