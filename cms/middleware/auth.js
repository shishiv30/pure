export const requireAuth = (req, res, next) => {
	if (!req.session || !req.session.userId) {
		return res.status(401).json({
			code: 401,
			message: 'Authentication required',
			data: null
		});
	}
	next();
};

export const requireAdmin = (req, res, next) => {
	if (!req.session || !req.session.userId) {
		return res.status(401).json({
			code: 401,
			message: 'Authentication required',
			data: null
		});
	}

	if (req.session.role !== 'admin') {
		return res.status(403).json({
			code: 403,
			message: 'Admin access required',
			data: null
		});
	}
	next();
};

export const requireReadAccess = (req, res, next) => {
	if (!req.session || !req.session.userId) {
		return res.status(401).json({
			code: 401,
			message: 'Authentication required',
			data: null
		});
	}
	// Both user and admin can read
	next();
};
