const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ErrorController = require('./ErrorController');

const JWT_SECRET = process.env.SESSION_SECRET || 'your-secret-key';

exports.apiLogin = async (req, res) => {
	try {
		const { email, password } = req.body;
		
		const user = await User.findOne({ where: { email } });
		
		if (!user) {
			return ErrorController.unauthorized(res, 'Invalid email or password');
		}
		
		if (user.password !== password) {
			return ErrorController.unauthorized(res, 'Invalid email or password');
		}
		
		const token = jwt.sign(
			{ 
				userId: user.id, 
				email: user.email 
			}, 
			JWT_SECRET, 
			{ expiresIn: '24h' }
		);
		
		res.json({
			token: token,
			user: {
				id: user.id,
				email: user.email
			}
		});
	} catch (error) {
		ErrorController.handleError(error, req, res);
	}
};

exports.apiLogout = async (req, res) => {
	try {
		res.json({
			message: 'Logout successful'
		});
	} catch (error) {
		ErrorController.handleError(error, req, res);
	}
};