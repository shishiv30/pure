import { Router } from 'express';
import BaseController from '../controllers/basecontroller.js';
const router = Router();

router.use((req, res, next) => {
	next();
});

router.get('/', (req, res) => {
	BaseController.dist(res, 'index.html');
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

export default router;
