import BaseController from '../controllers/basecontroller.js';

async function handleSitemapRoute(controller, res) {
	try {
		const model = await controller.get();
		if (model && model.code === 500) {
			console.error('Sitemap get failed:', model.error);
			res.status(500).send('Unable to load this page. Please try again later.');
			return;
		}
		await controller.toPage(model);
	} catch (err) {
		console.error('Sitemap route error:', err);
		res.status(500).send('Unable to load this page. Please try again later.');
	}
}

export default function registerSitemap(router) {
	// Order: most specific first so county and city patterns match before state.

	// County level: sitemap/{stateCode}/{county}_county -> cities
	router.get(/^\/sitemap\/([a-z]{2})\/([^/]+)_county\/?$/i, async (req, res) => {
		await handleSitemapRoute(new BaseController(req, res, 'sitemap-county'), res);
	});

	// City level: sitemap/{stateCode}/{city} -> neighborhoods + zipcodes
	router.get(/^\/sitemap\/([a-z]{2})\/([^/]+)\/?$/i, async (req, res) => {
		await handleSitemapRoute(new BaseController(req, res, 'sitemap-city'), res);
	});

	// State level: sitemap/{stateCode} -> counties
	router.get(/^\/sitemap\/([a-z]{2})\/?$/i, async (req, res) => {
		await handleSitemapRoute(new BaseController(req, res, 'sitemap-state'), res);
	});

	// Root: sitemap/ -> states
	router.get(/^\/sitemap\/?$/, async (req, res) => {
		await handleSitemapRoute(new BaseController(req, res, 'sitemap'), res);
	});
}
