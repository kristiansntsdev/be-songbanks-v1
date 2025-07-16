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
		
		if (!user.status || user.status === 'guest' || user.status === 'pending' || user.status === 'suspend') {
			return ErrorController.accountAccessDenied(res, user.status);
		}
		
		const token = jwt.sign(
			{ 
				userId: user.id, 
				email: user.email,
				role: user.role
			}, 
			JWT_SECRET, 
			{ expiresIn: '24h' }
		);
		
		if (user.role === 'admin') {
			res.json({
				code: 200,
				message: 'Login successful',
				data: {
					token: token,
					user: {
						id: user.id,
						email: user.email,
						role: user.role,
						is_admin: true,
						status: user.status
					}
				}
			});
		} else {
			res.json({
				code: 200,
				message: 'Login successful',
				data: {
					token: token,
					user: {
						id: user.id,
						email: user.email,
						role: user.role,
						status: user.status
					}
				}
			});
		}
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