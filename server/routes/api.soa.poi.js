import express from 'express';
import config from '../config.js';
import { fetchFromSoa } from '../configs/realestate.js';

const router = express.Router();
router.use(express.json());

function sendJson(res, data) {
	res.json(data);
}

function handleSoaError(res, error) {
	console.error('SOA POI API error:', error);
	const match = error.message?.match(/: (\d{3}) /);
	const status = match ? Number(match[1]) : 500;
	res.status(status).json({ error: error.message || 'Internal server error' });
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
async function proxyToPoi(req, res) {
	try {
		if (!config.poiApiDomain) {
			res.status(503).json({ error: 'POI_API_DOMAIN is not configured' });
			return;
		}
		const path = req.path;
		if (!path || path === '/') {
			res.status(404).json({ error: 'POI API path required' });
			return;
		}
		const method = req.method;
		const options = { query: req.query };
		if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && req.body) {
			options.body = req.body;
		}
		const data = await fetchFromSoa(config.poiApiDomain, method, path, options);
		sendJson(res, data);
	} catch (error) {
		handleSoaError(res, error);
	}
}

router.get('*', proxyToPoi);
router.post('*', proxyToPoi);

export default router;
