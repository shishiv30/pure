import BaseController from '../controllers/basecontroller.js';

function handleDemoRoute(controller, res) {
	return (async () => {
		try {
			const model = await controller.get();
			if (model && model.code === 500) {
				console.error('Demo get failed:', model.error);
				res.status(500).send('Unable to load this page. Please try again later.');
				return;
			}
			await controller.toPage(model);
		} catch (err) {
			console.error('Demo route error:', err);
			res.status(500).send('Unable to load this page. Please try again later.');
		}
	})();
}

export default function registerDemo(router) {
	// Redirect /demo/ to /demo/sitemap
	router.get(/^\/demo\/?$/, (req, res) => {
		res.redirect(301, '/demo/sitemap');
	});

	router.get(/^\/demo\/sitemap\/?$/, async (req, res) => {
		await handleDemoRoute(new BaseController(req, res, 'demo-sitemap'), res);
	});

	// State level sitemap: /demo/sitemap/{stateCode} - shows counties
	router.get(/^\/demo\/sitemap\/([a-z]{2})\/?$/, async (req, res) => {
		await handleDemoRoute(new BaseController(req, res, 'demo-sitemap-state'), res);
	});

	// County level sitemap: /demo/sitemap/{stateCode}/{county}_county - shows cities
	router.get(/^\/demo\/sitemap\/([a-z]{2})\/([^\/]+)_county\/?$/, async (req, res) => {
		await handleDemoRoute(new BaseController(req, res, 'demo-sitemap-county'), res);
	});

	// City level sitemap: /demo/sitemap/{stateCode}/{city} - shows zipcodes
	router.get(/^\/demo\/sitemap\/([a-z]{2})\/([^\/]+)\/?$/, async (req, res) => {
		await handleDemoRoute(new BaseController(req, res, 'demo-sitemap-city'), res);
	});

	router.get(/^\/demo([\/\w\-]+)\/?$/, async (req, res) => {
		req.query.path = req?.params[0] || '';
		await handleDemoRoute(new BaseController(req, res, 'demo'), res);
	});
}
