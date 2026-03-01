import { Router } from 'express';
import registerDefault from './default.js';
import registerDemo from './demo.js';
import registerPage from './page.js';
import apiRouter from './api.js';

const router = Router();
registerDefault(router);
registerDemo(router);
registerPage(router);
router.use('/api', apiRouter);

export default router;
