import { Router } from 'express';
const router = Router();

router.use((req, res, next) => {
	console.log('Time: ', Date.now());
	next();
});

router.get('/', (req, res) => {
	res.send('Hello World');
});

// define the about route
router.get('/about', (req, res) => {
	res.send('About page');
});

export default router;
