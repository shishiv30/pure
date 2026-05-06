import express from 'express';
import config from '../config.js';
import { fetchFromSoa } from '../configs/realestate.js';

const router = express.Router();
router.use(express.json());

function sendJson(res, data) {
	res.json(data);
}

function getSchoolApiDomain() {
	if (!config.schoolApiDomain) {
		throw new Error('SCHOOL_API_DOMAIN is not configured');
	}
	return config.schoolApiDomain;
}

function handleSoaError(res, error) {
	console.error('SOA School API error:', error);
	const status =
		error.message === 'SCHOOL_API_DOMAIN is not configured'
			? 503
			: error.message === 'School API path required'
				? 400
				: 500;
	const match = error.message?.match(/: (\d{3}) /);
	const fallbackStatus = match ? Number(match[1]) : status;
	res.status(fallbackStatus).json({ error: error.message || 'Internal server error' });
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
export async function getNearbySchoolsByLocation(latLng, query = {}) {
	const domain = getSchoolApiDomain();
	const path = `/property/locations/${latLng}/assignedSchools`;
	return fetchFromSoa(domain, 'GET', path, { query });
}

async function getNearbySchoolsByLocationHandler(req, res) {
	try {
		sendJson(res, await getNearbySchoolsByLocation(req.params.latLng, req.query));
	} catch (error) {
		handleSoaError(res, error);
	}
}

router.get('/property/locations/:latLng/assignedSchools', getNearbySchoolsByLocationHandler);

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
export async function proxyToSchool(method, path, options = {}) {
	const domain = getSchoolApiDomain();
	if (!path || path === '/') {
		throw new Error('School API path required');
	}
	return fetchFromSoa(domain, method, path, options);
}

async function proxyToSchoolHandler(req, res) {
	try {
		const method = req.method;
		const options = { query: req.query };
		if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && req.body) {
			options.body = req.body;
		}
		sendJson(res, await proxyToSchool(method, req.path, options));
	} catch (error) {
		handleSoaError(res, error);
	}
}

router.get('*', proxyToSchoolHandler);
router.post('*', proxyToSchoolHandler);
router.put('*', proxyToSchoolHandler);
router.delete('*', proxyToSchoolHandler);

export default router;
