import express from 'express';
import config from '../config.js';
import { fetchFromSoa } from '../configs/realestate.js';

const router = express.Router();
router.use(express.json());

function sendJson(res, data) {
	res.json(data);
}

function handleSoaError(res, error) {
	console.error('SOA School API error:', error);
	const match = error.message?.match(/: (\d{3}) /);
	const status = match ? Number(match[1]) : 500;
	res.status(status).json({ error: error.message || 'Internal server error' });
}

// --- Explicit SOA school routes (order: specific before catch-all) ---

/**
 * @swagger
 * /soa/school/property/locations/{latLng}/assignedSchools:
 *   get:
 *     summary: Get nearby schools by location (lat,lng in one segment, e.g. 40.7,-74.0)
 *     tags:
 *       - SOA School
 */
async function getNearbySchoolsByLocation(req, res) {
	try {
		if (!config.schoolApiDomain) {
			res.status(503).json({ error: 'SCHOOL_API_DOMAIN is not configured' });
			return;
		}
		const { latLng } = req.params;
		const path = `/property/locations/${latLng}/assignedSchools`;
		const options = { query: req.query };
		const data = await fetchFromSoa(config.schoolApiDomain, 'GET', path, options);
		sendJson(res, data);
	} catch (error) {
		handleSoaError(res, error);
	}
}

router.get('/property/locations/:latLng/assignedSchools', getNearbySchoolsByLocation);

/**
 * @swagger
 * /soa/school/{path}:
 *   get:
 *     summary: Proxy to School SOA API (GET)
 *     description: Forwards GET to SCHOOL_API_DOMAIN. See docs/soa-api.md.
 *     tags:
 *       - SOA School
 *   post:
 *     summary: Proxy to School SOA API (POST)
 *     tags:
 *       - SOA School
 *   put:
 *     summary: Proxy to School SOA API (PUT)
 *     tags:
 *       - SOA School
 *   delete:
 *     summary: Proxy to School SOA API (DELETE)
 *     tags:
 *       - SOA School
 */
async function proxyToSchool(req, res) {
	try {
		if (!config.schoolApiDomain) {
			res.status(503).json({ error: 'SCHOOL_API_DOMAIN is not configured' });
			return;
		}
		const path = req.path;
		if (!path || path === '/') {
			res.status(404).json({ error: 'School API path required' });
			return;
		}
		const method = req.method;
		const options = { query: req.query };
		if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && req.body) {
			options.body = req.body;
		}
		const data = await fetchFromSoa(config.schoolApiDomain, method, path, options);
		sendJson(res, data);
	} catch (error) {
		handleSoaError(res, error);
	}
}

router.get('*', proxyToSchool);
router.post('*', proxyToSchool);
router.put('*', proxyToSchool);
router.delete('*', proxyToSchool);

export default router;
