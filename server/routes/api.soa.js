import express from 'express';
import apiSoaProperty from './api.soa.property.js';
import apiSoaSchool from './api.soa.school.js';
import apiSoaGeoarea from './api.soa.geoarea.js';
import apiSoaPoi from './api.soa.poi.js';

const router = express.Router();
router.use(express.json());

// Mount order: specific prefixes first so /api/soa/property/*, /school/*, /poi/* are handled;
// then geoarea at / so /api/soa/states, /api/soa/state/..., and catch-all geoarea proxy remain.
router.use('/property', apiSoaProperty);
router.use('/school', apiSoaSchool);
router.use('/poi', apiSoaPoi);
router.use('/', apiSoaGeoarea);

export default router;
