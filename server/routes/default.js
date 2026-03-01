import BaseController from '../controllers/basecontroller.js';
import { pageConfig } from '../../webpack.config.base.page.js';

export default function registerDefault(router) {
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

	// For /about /3d /animation redirect to [page.name].html; pageConfig from webpack.config.base.page.js
	pageConfig.pages.forEach((page) => {
		if (page.name && page.static) {
			router.get(`/${page.name}`, (req, res) => {
				BaseController.dist(res, `${page.name}.html`);
			});
		}
	});
}
