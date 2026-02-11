import User from '../models/User.js';

export const checkSetup = async (req, res, next) => {
	try {
		const userModel = new User(req.app.locals.db.getDb());
		const hasAdmin = await userModel.hasAdmin();

		// Public routes that don't require setup
		const publicRoutes = [
			'/api/setup',
			'/api/pages/content/',
			'/api/pages/getPageContentByName',
			'/api/sitemap/public',
			'/setup',
			'/',
			'/health'
		];

		const isPublicRoute = publicRoutes.some(route => req.path.startsWith(route));

		// If no admin exists and not on public route, redirect to setup
		if (!hasAdmin && !isPublicRoute) {
			return res.status(503).json({
				code: 503,
				message: 'CMS setup required. Please create an admin user first.',
				data: { setupRequired: true }
			});
		}

		req.app.locals.setupComplete = hasAdmin;
		next();
	} catch (error) {
		console.error('Setup check error:', error);
		return res.status(500).json({
			code: 500,
			message: 'Internal server error',
			data: null
		});
	}
};
