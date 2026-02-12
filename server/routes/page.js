import { Router } from 'express';
import BaseController from '../controllers/basecontroller.js';
import { pageConfig } from '../../webpack.config.base.page.js';
const router = Router();

router.use((req, res, next) => {
	next();
});

router.get('/', async (req, res) => {
	const controller = new BaseController(req, res, 'index');
	const model = await controller.get();
	controller.toPage(model);
});

// Dynamic page: fetch content from CMS by key (e.g. /page/index, /page/about)
router.get('/page/:key', async (req, res) => {
	const controller = new BaseController(req, res, 'page');
	const model = await controller.get();
	controller.toPage(model);
});


router.get(/^\/demo\/sitemap\/?$/, async (req, res) => {
	const controller = new BaseController(req, res, 'demo-sitemap');
	const model = await controller.get();
	controller.toPage(model);
});

// State level sitemap: /demo/sitemap/{stateCode} - shows counties
router.get(/^\/demo\/sitemap\/([a-z]{2})\/?$/, async (req, res) => {
	const controller = new BaseController(req, res, 'demo-sitemap-state');
	const model = await controller.get();
	controller.toPage(model);
});

// County level sitemap: /demo/sitemap/{stateCode}/{county}_county - shows cities
router.get(/^\/demo\/sitemap\/([a-z]{2})\/([^\/]+)_county\/?$/, async (req, res) => {
	const controller = new BaseController(req, res, 'demo-sitemap-county');
	const model = await controller.get();
	controller.toPage(model);
});

// City level sitemap: /demo/sitemap/{stateCode}/{city} - shows zipcodes
router.get(/^\/demo\/sitemap\/([a-z]{2})\/([^\/]+)\/?$/, async (req, res) => {
	const controller = new BaseController(req, res, 'demo-sitemap-city');
	const model = await controller.get();
	controller.toPage(model);
});

router.get(/^\/demo\/?$/, async (req, res) => {
	let controller = new BaseController(req, res, 'demo');
	let model = await controller.get();
	controller.toPage(model);
});

router.get(/^\/demo([\/\w\-]+)\/?$/, async (req, res) => {
	req.query.path = req?.params[0] || '';
	let controller = new BaseController(req, res, 'demo');
	let model = await controller.get();
	controller.toPage(model);
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
