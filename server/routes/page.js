import BaseController from '../controllers/basecontroller.js';

export default function registerPage(router) {
	// Dynamic page: :key drives data source. In production uses data/page/{key}.js only; else CMS then data/page/{key}.js
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
}
