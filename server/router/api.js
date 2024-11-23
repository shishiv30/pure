import { Router } from 'express';
const router = Router();
import BaseController from '../controllers/baseController.js';

router.use((req, res, next) => {
	console.log('Time: ', Date.now());
	next();
});

router.get('/:name', async (req, res) => {
	//get current router is get or post or put or delete
	let controller = new BaseController(req, res, req.params.name);
	let data = await controller.get();
	controller.sendApi(data);
});

export default router;
