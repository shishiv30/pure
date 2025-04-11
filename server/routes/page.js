import { Router } from 'express';
import BaseController from '../controllers/basecontroller.js';
const router = Router();

router.use((req, res, next) => {
	console.log('Time: ', Date.now());
	next();
});

router.get('/', (req, res) => {
	res.send('Hello World');
});

router.get(/^\/sap\/?$/, async (req, res) => {
	let controller = new BaseController(req, res, 'sap');
	let model = await controller.get();
	controller.toPage(model);
});

router.get(/^\/sap([\/\w\-]+)\/?$/, async (req, res) => {
	req.query.path = req?.params[0] || '';
	let controller = new BaseController(req, res, 'sap');
	let model = await controller.get();
	controller.toPage(model);
});

export default router;
