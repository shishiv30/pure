import express from 'express';
import config from '../config.js';
import { fetchFromSoa } from '../configs/realestate.js';

const router = express.Router();
router.use(express.json());

function sendJson(res, data) {
	res.json(data);
}

function getPoiApiDomain() {
	if (!config.poiApiDomain) {
		throw new Error('POI_API_DOMAIN is not configured');
	}
	return config.poiApiDomain;
}

function handleSoaError(res, error) {
	console.error('SOA POI API error:', error);
	const status =
		error.message === 'POI_API_DOMAIN is not configured'
			? 503
			: error.message === 'POI API path required'
				? 400
				: 500;
	const match = error.message?.match(/: (\d{3}) /);
	const fallbackStatus = match ? Number(match[1]) : status;
	res.status(fallbackStatus).json({ error: error.message || 'Internal server error' });
}

/**
 * @swagger
 * /soa/poi/{path}:
 *   get:
 *     summary: Proxy to POI SOA API (GET)
 *     description: Forwards GET to POI_API_DOMAIN. See docs/soa-api.md.
 *     tags:
 *       - SOA POI
 *   post:
 *     summary: Proxy to POI SOA API (POST)
 *     tags:
 *       - SOA POI
 */
export async function proxyToPoi(method, path, options = {}) {
	const domain = getPoiApiDomain();
	if (!path || path === '/') {
		throw new Error('POI API path required');
	}
	return fetchFromSoa(domain, method, path, options);
}

async function proxyToPoiHandler(req, res) {
	try {
		const method = req.method;
		const options = { query: req.query };
		if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && req.body) {
			options.body = req.body;
		}
		sendJson(res, await proxyToPoi(method, req.path, options));
	} catch (error) {
		handleSoaError(res, error);
	}
}

router.get('*', proxyToPoiHandler);
router.post('*', proxyToPoiHandler);

export default router;
