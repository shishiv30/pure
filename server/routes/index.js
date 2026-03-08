import { Router } from 'express';
import registerDefault from './default.js';
import registerDemo from './demo.js';
import registerPage from './page.js';
import apiRouter from './api.js';
import apiSoaRouter from './api.soa.js';

const router = Router();
registerDefault(router);
registerDemo(router);
registerPage(router);
router.use('/api', apiRouter);
router.use('/api/soa', apiSoaRouter);

export default router;
