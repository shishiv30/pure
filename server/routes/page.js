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
