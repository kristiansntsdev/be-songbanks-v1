class ErrorController {
	static notFound(req, res) {
		res.status(404).json({
			error: 'Route not found',
			message: `Cannot ${req.method} ${req.originalUrl}`,
			statusCode: 404
		});
	}

	static badRequest(res, message = 'Bad request') {
		res.status(400).json({
			error: 'Bad request',
			message: message,
			statusCode: 400
		});
	}

	static unauthorized(res, message = 'Unauthorized') {
		res.status(401).json({
			error: 'Unauthorized',
			message: message,
			statusCode: 401
		});
	}

	static forbidden(res, message = 'Forbidden') {
		res.status(403).json({
			error: 'Forbidden',
			message: message,
			statusCode: 403
		});
	}

	static internalServerError(res, message = 'Internal server error') {
		res.status(500).json({
			error: 'Internal server error',
			message: message,
			statusCode: 500
		});
	}

	static validationError(res, errors) {
		res.status(422).json({
			error: 'Validation error',
			message: 'Request validation failed',
			errors: errors,
			statusCode: 422
		});
	}

	static conflict(res, message = 'Conflict') {
		res.status(409).json({
			error: 'Conflict',
			message: message,
			statusCode: 409
		});
	}

	static accountAccessDenied(res, status) {
		res.status(403).json({
			code: 403,
			message: 'Account access denied',
			error: `Your account status is ${status || 'inactive'}. Please contact administrator.`
		});
	}

	static handleError(err, req, res, next) {
		console.error(err);
		
		if (err.name === 'SequelizeValidationError') {
			const errors = err.errors.map(error => ({
				field: error.path,
				message: error.message
			}));
			return ErrorController.validationError(res, errors);
		}

		if (err.name === 'SequelizeUniqueConstraintError') {
			return ErrorController.conflict(res, 'Resource already exists');
		}

		ErrorController.internalServerError(res, err.message || 'Something went wrong');
	}
}

module.exports = ErrorController;