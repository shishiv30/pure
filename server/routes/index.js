import { Router } from 'express';
import registerDefault from './default.js';
import registerProperty from './property.js';
import registerPage from './page.js';
import registerSitemap from './sitemap.js';
import apiRouter from './api.js';
import apiSoaRouter from './api.soa.js';

const router = Router();
registerDefault(router);
registerProperty(router);
registerSitemap(router);
registerPage(router);
router.use('/api', apiRouter);
router.use('/api/soa', apiSoaRouter);

export default router;
