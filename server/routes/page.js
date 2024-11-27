import { Router } from 'express';
const router = Router();

router.use((req, res, next) => {
	console.log('Time: ', Date.now());
	next();
});

router.get('/', (req, res) => {
	res.send('Hello World');
});

export default router;
