const User = require('../models/User');
const ErrorController = require('./ErrorController');

class UserController {
    static async create(req, res) {
        try {
            const { email, password } = req.body;
            
            if (!email || !password) {
                return ErrorController.badRequest(res, 'Email and password are required');
            }
            
            const user = await User.create({ email, password });
            res.status(201).json({ id: user.id, email: user.email });
        } catch (error) {
            ErrorController.handleError(error, req, res);
        }
    }
}

module.exports = UserController;