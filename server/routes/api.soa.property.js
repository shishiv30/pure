import express from 'express';
import config from '../config.js';
import { fetchFromSoa } from '../configs/realestate.js';

const router = express.Router();
router.use(express.json());

function sendJson(res, data) {
	res.json(data);
}

function handleSoaError(res, error) {
	console.error('SOA Property API error:', error);
	const match = error.message?.match(/: (\d{3}) /);
	const status = match ? Number(match[1]) : 500;
	res.status(status).json({ error: error.message || 'Internal server error' });
}

// --- Explicit SOA property routes (order: specific before catch-all) ---

/**
 * @swagger
 * /soa/property/getPropertyByPath:
 *   get:
 *     summary: Get property by path (MLS public record associations URL)
 *     description: Proxies to SOA GET /mlsPublicRecordAssociations/url. Query param path is remapped to url.
 *     parameters:
 *       - in: query
 *         name: url
 *         schema: { type: string }
 *         description: Property URL path (sent to SOA as url)
 *       - in: query
 *         name: path
 *         schema: { type: string }
 *         description: Alternative to url; remapped to url for SOA
 *     responses:
 *       200:
 *         description: MLS public record associations response (structure from Property SOA)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Response shape defined by Property SOA API
 *               additionalProperties: true
 *       400:
 *         description: Bad request (missing or invalid params)
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { error: { type: string } } }
 *       404:
 *         description: Not found (SOA returned 404)
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { error: { type: string } } }
 *       503:
 *         description: PROPERTY_API_DOMAIN not configured
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { error: { type: string } } }
 *     tags:
 *       - SOA Property
 */
async function getPropertyByPath(req, res) {
	// Remap: path -> url for SOA /mlsPublicRecordAssociations/url
	const query = { ...req.query };
	if (query.path !== undefined && query.url === undefined) {
		query.url = query.path;
		delete query.path;
	}
	await proxyToPropertyPath(req, res, 'GET', '/mlsPublicRecordAssociations/url', { query });
}

/**
 * @swagger
 * /soa/property/getPropertyHistoryById:
 *   get:
 *     summary: Get property history by ID (query)
 *     description: Proxies to SOA GET /properties/{propertyId}/histories. Pass propertyId in query.
 *     parameters:
 *       - in: query
 *         name: propertyId
 *         required: true
 *         schema: { type: string }
 *         description: Property ID
 *     responses:
 *       200:
 *         description: Property histories (structure from Property SOA)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Response shape defined by Property SOA API
 *               additionalProperties: true
 *       400:
 *         description: propertyId is required
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { error: { type: string } } }
 *       503:
 *         description: PROPERTY_API_DOMAIN not configured
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { error: { type: string } } }
 *     tags:
 *       - SOA Property
 * /soa/property/getPropertyHistoryById/{propertyId}:
 *   get:
 *     summary: Get property history by ID (path)
 *     description: Proxies to SOA GET /properties/{propertyId}/histories. Pass propertyId in path.
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema: { type: string }
 *         description: Property ID
 *     responses:
 *       200:
 *         description: Property histories (structure from Property SOA)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Response shape defined by Property SOA API
 *               additionalProperties: true
 *       400:
 *         description: propertyId is required
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { error: { type: string } } }
 *       503:
 *         description: PROPERTY_API_DOMAIN not configured
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { error: { type: string } } }
 *     tags:
 *       - SOA Property
 */
async function getPropertyHistoryById(req, res) {
	const propertyId = req.params.propertyId ?? req.query.propertyId;
	if (!propertyId) {
		res.status(400).json({ error: 'propertyId is required' });
		return;
	}
	const query = { ...req.query };
	delete query.propertyId;
	await proxyToPropertyPath(req, res, 'GET', `/properties/${propertyId}/histories`, { query });
}

/**
 * @swagger
 * /soa/property/getPropertyListingInfoById:
 *   get:
 *     summary: Get property primary listing info by ID (v2, query)
 *     description: Proxies to SOA GET /properties/{propertyId}/primary-listing/v2. Pass propertyId in query.
 *     parameters:
 *       - in: query
 *         name: propertyId
 *         required: true
 *         schema: { type: string }
 *         description: Property ID
 *     responses:
 *       200:
 *         description: Primary listing info v2 (structure from Property SOA)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Response shape defined by Property SOA API
 *               additionalProperties: true
 *       400:
 *         description: propertyId is required
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { error: { type: string } } }
 *       503:
 *         description: PROPERTY_API_DOMAIN not configured
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { error: { type: string } } }
 *     tags:
 *       - SOA Property
 * /soa/property/getPropertyListingInfoById/{propertyId}:
 *   get:
 *     summary: Get property primary listing info by ID (v2, path)
 *     description: Proxies to SOA GET /properties/{propertyId}/primary-listing/v2. Pass propertyId in path.
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema: { type: string }
 *         description: Property ID
 *     responses:
 *       200:
 *         description: Primary listing info v2 (structure from Property SOA)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Response shape defined by Property SOA API
 *               additionalProperties: true
 *       400:
 *         description: propertyId is required
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { error: { type: string } } }
 *       503:
 *         description: PROPERTY_API_DOMAIN not configured
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { error: { type: string } } }
 *     tags:
 *       - SOA Property
 */
async function getPropertyListingInfoById(req, res) {
	const propertyId = req.params.propertyId ?? req.query.propertyId;
	if (!propertyId) {
		res.status(400).json({ error: 'propertyId is required' });
		return;
	}
	const query = { ...req.query };
	delete query.propertyId;
	await proxyToPropertyPath(req, res, 'GET', `/properties/${propertyId}/primary-listing/v2`, {
		query,
	});
}

/**
 * @swagger
 * /soa/property/searchHouse:
 *   post:
 *     summary: Search house (nearby search v2)
 *     description: Proxies to SOA POST /listings/nearbysearch/v2. Request body forwarded as-is.
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Search criteria (shape defined by Property SOA nearbysearch v2)
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Nearby search results (structure from Property SOA)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Response shape defined by Property SOA API
 *               additionalProperties: true
 *       503:
 *         description: PROPERTY_API_DOMAIN not configured
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { error: { type: string } } }
 *     tags:
 *       - SOA Property
 */
async function searchHouse(req, res) {
	await proxyToPropertyPath(req, res, 'POST', '/listings/nearbysearch/v2');
}

/**
 * @swagger
 * /soa/property/getNearbyForSaleHouseByLocation:
 *   get:
 *     summary: Get nearby for-sale houses by location
 *     description: Proxies to SOA GET /listings/nearbysearch/v2. All query params forwarded.
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema: { type: number }
 *         description: Latitude
 *       - in: query
 *         name: lng
 *         schema: { type: number }
 *         description: Longitude
 *       - in: query
 *         name: radius
 *         schema: { type: number }
 *         description: Search radius (usage per SOA spec)
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *         description: Max results (if supported by SOA)
 *     responses:
 *       200:
 *         description: Nearby for-sale listings (structure from Property SOA)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Response shape defined by Property SOA API
 *               additionalProperties: true
 *       503:
 *         description: PROPERTY_API_DOMAIN not configured
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { error: { type: string } } }
 *     tags:
 *       - SOA Property
 */
async function getNearbyForSaleHouseByLocation(req, res) {
	await proxyToPropertyPath(req, res, 'GET', '/listings/nearbysearch/v2');
}

/**
 * @swagger
 * /soa/property/getNearbySoldHouseByLocation:
 *   get:
 *     summary: Get nearby sold houses by location
 *     description: Proxies to SOA GET /listings/nearbysoldsearch. All query params forwarded.
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema: { type: number }
 *         description: Latitude
 *       - in: query
 *         name: lng
 *         schema: { type: number }
 *         description: Longitude
 *       - in: query
 *         name: radius
 *         schema: { type: number }
 *         description: Search radius (usage per SOA spec)
 *     responses:
 *       200:
 *         description: Nearby sold listings (structure from Property SOA)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Response shape defined by Property SOA API
 *               additionalProperties: true
 *       503:
 *         description: PROPERTY_API_DOMAIN not configured
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { error: { type: string } } }
 *     tags:
 *       - SOA Property
 */
async function getNearbySoldHouseByLocation(req, res) {
	await proxyToPropertyPath(req, res, 'GET', '/listings/nearbysoldsearch');
}

async function proxyToPropertyPath(req, res, method, path, overrides = {}) {
	try {
		if (!config.propertyApiDomain) {
			res.status(503).json({ error: 'PROPERTY_API_DOMAIN is not configured' });
			return;
		}
		const options = {
			query: overrides.query ?? req.query,
			...(overrides.body !== undefined && { body: overrides.body }),
		};
		if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && req.body) {
			options.body = options.body ?? req.body;
		}
		const data = await fetchFromSoa(config.propertyApiDomain, method, path, options);
		sendJson(res, data);
	} catch (error) {
		handleSoaError(res, error);
	}
}

router.get('/getPropertyByPath', getPropertyByPath);
router.get('/getPropertyHistoryById', getPropertyHistoryById);
router.get('/getPropertyHistoryById/:propertyId', getPropertyHistoryById);
router.get('/getPropertyListingInfoById', getPropertyListingInfoById);
router.get('/getPropertyListingInfoById/:propertyId', getPropertyListingInfoById);
router.post('/searchHouse', searchHouse);
router.get('/getNearbyForSaleHouseByLocation', getNearbyForSaleHouseByLocation);
router.get('/getNearbySoldHouseByLocation', getNearbySoldHouseByLocation);

/**
 * @swagger
 * /soa/property/{path}:
 *   get:
 *     summary: Proxy to Property SOA API (GET)
 *     description: Forwards GET to PROPERTY_API_DOMAIN. See docs/soa-api.md.
 *     tags:
 *       - SOA Property
 *   post:
 *     summary: Proxy to Property SOA API (POST)
 *     tags:
 *       - SOA Property
 *   put:
 *     summary: Proxy to Property SOA API (PUT)
 *     tags:
 *       - SOA Property
 *   delete:
 *     summary: Proxy to Property SOA API (DELETE)
 *     tags:
 *       - SOA Property
 */
async function proxyToProperty(req, res) {
	try {
		if (!config.propertyApiDomain) {
			res.status(503).json({ error: 'PROPERTY_API_DOMAIN is not configured' });
			return;
		}
		const path = req.path;
		if (!path || path === '/') {
			res.status(404).json({ error: 'Property API path required' });
			return;
		}
		const method = req.method;
		const options = { query: req.query };
		if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && req.body) {
			options.body = req.body;
		}
		const data = await fetchFromSoa(config.propertyApiDomain, method, path, options);
		sendJson(res, data);
	} catch (error) {
		handleSoaError(res, error);
	}
}

router.get('*', proxyToProperty);
router.post('*', proxyToProperty);
router.put('*', proxyToProperty);
router.delete('*', proxyToProperty);

export default router;
