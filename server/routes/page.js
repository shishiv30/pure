import { Router } from 'express';
import BaseController from '../controllers/basecontroller.js';
import { pageConfig } from '../../webpack.config.base.page.js';
const router = Router();

router.use((req, res, next) => {
	next();
});

router.get('/', async (req, res) => {
	try {
		const controller = new BaseController(req, res, 'page');
		const model = await controller.get();
		if (model && model.code === 500) {
			console.error('Index page get failed:', model.error);
			res.status(500).send('Unable to load this page. Please try again later.');
			return;
		}
		await controller.toPage(model);
	} catch (err) {
		console.error('Index route error:', err);
		res.status(500).send('Unable to load this page. Please try again later.');
	}
});

// Dynamic page: fetch content from CMS by key (e.g. /page/index, /page/ai-trend, /page/about)
router.get('/page/:key', async (req, res) => {
	try {
		const controller = new BaseController(req, res, 'page');
		const model = await controller.get();
		if (model && model.code === 500) {
			console.error('Page get failed:', req.params?.key, model.error);
			res.status(500).send('Unable to load this page. Please try again later.');
			return;
		}
		await controller.toPage(model);
	} catch (err) {
		console.error('Page route error:', req.params?.key, err);
		res.status(500).send('Unable to load this page. Please try again later.');
	}
});


// Redirect /demo/ to /demo/sitemap
router.get(/^\/demo\/?$/, (req, res) => {
	res.redirect(301, '/demo/sitemap');
});

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

//for /about /3d /animation redirect to [page.name].html directly we can find the pageConfig in webpack.config.base.page.js
pageConfig.pages.forEach((page) => {
	if (page.name && page.static) {
		router.get(`/${page.name}`, (req, res) => {
			BaseController.dist(res, `${page.name}.html`);
		});
	}
});

export default router;
