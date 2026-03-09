import express from 'express';
import { fetchStatesFromGeoarea, fetchFromGeoarea } from '../configs/realestate.js';
import {
	mapSoaStatesResponse,
	mapSoaCountiesResponse,
	mapSoaCitiesResponse,
	mapSoaNeighborhoodsResponse,
	mapSoaZipcodesResponse,
	mapSoaSingleItemResponse,
} from '../../helpers/soaGeoMapper.js';

const router = express.Router();

function sendJson(res, data) {
	res.json(data);
}

function handleSoaError(res, error) {
	console.error('SOA Geoarea API error:', error);
	const match = error.message?.match(/: (\d{3}) /);
	const status = match ? Number(match[1]) : 500;
	res.status(status).json({ error: error.message || 'Internal server error' });
}

/**
 * @swagger
 * /soa/states:
 *   get:
 *     summary: Get all states
 *     description: Returns list of states mapped to UI geo model. Requires GEOAREA_API_DOMAIN and SOA_API_KEY.
 *     responses:
 *       200:
 *         description: Array of state geo objects
 *     tags:
 *       - SOA Geoarea
 */
export async function getStates(req, res) {
	try {
		const raw = await fetchStatesFromGeoarea();
		sendJson(res, mapSoaStatesResponse(raw));
	} catch (error) {
		handleSoaError(res, error);
	}
}

/**
 * @swagger
 * /soa/state/{stateCode}/counties:
 *   get:
 *     summary: Get counties by state code
 *     tags:
 *       - SOA Geoarea
 */
export async function getCountiesByStateCode(req, res) {
	try {
		const { stateCode } = req.params;
		const data = await fetchFromGeoarea('GET', `/state/${stateCode}/counties`, {
			query: req.query,
		});
		sendJson(res, mapSoaCountiesResponse(data));
	} catch (error) {
		handleSoaError(res, error);
	}
}

/**
 * @swagger
 * /soa/statecode/{stateCode}/countyid/{countyId}/nearcounties:
 *   get:
 *     summary: Get nearby counties by state and county ID
 *     tags:
 *       - SOA Geoarea
 */
export async function getNearbyCountiesByCountyId(req, res) {
	try {
		const { stateCode, countyId } = req.params;
		const data = await fetchFromGeoarea(
			'GET',
			`/statecode/${stateCode}/countyid/${countyId}/nearcounties`,
			{ query: req.query },
		);
		sendJson(res, mapSoaCountiesResponse(data));
	} catch (error) {
		handleSoaError(res, error);
	}
}

/**
 * @swagger
 * /soa/state/{stateCode}/cities:
 *   get:
 *     summary: Get cities by state code
 *     tags:
 *       - SOA Geoarea
 */
export async function getCitiesByState(req, res) {
	try {
		const { stateCode } = req.params;
		const data = await fetchFromGeoarea('GET', `/state/${stateCode}/cities`, {
			query: req.query,
		});
		sendJson(res, mapSoaCitiesResponse(data));
	} catch (error) {
		handleSoaError(res, error);
	}
}

/**
 * @swagger
 * /soa/county/{countyId}/cities:
 *   get:
 *     summary: Get cities by county ID
 *     tags:
 *       - SOA Geoarea
 */
export async function getCitiesByCountyId(req, res) {
	try {
		const { countyId } = req.params;
		const data = await fetchFromGeoarea('GET', `/county/${countyId}/cities`, {
			query: req.query,
		});
		sendJson(res, mapSoaCitiesResponse(data));
	} catch (error) {
		handleSoaError(res, error);
	}
}

/**
 * @swagger
 * /soa/city/{cityId}/nearbycities:
 *   get:
 *     summary: Get nearby cities by city ID
 *     tags:
 *       - SOA Geoarea
 */
export async function getNearbyCitiesByCityId(req, res) {
	try {
		const { cityId } = req.params;
		const data = await fetchFromGeoarea('GET', `/city/${cityId}/nearbycities`, {
			query: req.query,
		});
		sendJson(res, mapSoaCitiesResponse(data));
	} catch (error) {
		handleSoaError(res, error);
	}
}

/**
 * @swagger
 * /soa/ip/{ipAddress}/citylocation:
 *   get:
 *     summary: Get city by IP address
 *     tags:
 *       - SOA Geoarea
 */
export async function getCityByIP(req, res) {
	try {
		const { ipAddress } = req.params;
		const data = await fetchFromGeoarea('GET', `/ip/${ipAddress}/citylocation`, {
			query: req.query,
		});
		const geo = mapSoaSingleItemResponse(data);
		sendJson(res, geo ?? data);
	} catch (error) {
		handleSoaError(res, error);
	}
}

/**
 * @swagger
 * /soa/city/{cityId}/neighborhoods:
 *   get:
 *     summary: Get neighborhoods by city ID
 *     tags:
 *       - SOA Geoarea
 */
export async function getNeighborhoodsByCityId(req, res) {
	try {
		const { cityId } = req.params;
		const data = await fetchFromGeoarea('GET', `/city/${cityId}/neighborhoods`, {
			query: req.query,
		});
		sendJson(res, mapSoaNeighborhoodsResponse(data));
	} catch (error) {
		handleSoaError(res, error);
	}
}

/**
 * @swagger
 * /soa/state/{stateCode}/postalcodes:
 *   get:
 *     summary: Get zipcodes/postalcodes by state code
 *     tags:
 *       - SOA Geoarea
 */
export async function getZipcodesByStatecode(req, res) {
	try {
		const { stateCode } = req.params;
		const data = await fetchFromGeoarea('GET', `/state/${stateCode}/postalcodes`, {
			query: req.query,
		});
		sendJson(res, mapSoaZipcodesResponse(data));
	} catch (error) {
		handleSoaError(res, error);
	}
}

/**
 * @swagger
 * /soa/city/{cityId}/postalcodes:
 *   get:
 *     summary: Get zipcodes/postalcodes by city ID
 *     tags:
 *       - SOA Geoarea
 */
export async function getZipcodesByCityId(req, res) {
	try {
		const { cityId } = req.params;
		const data = await fetchFromGeoarea('GET', `/city/${cityId}/postalcodes`, {
			query: req.query,
		});
		sendJson(res, mapSoaZipcodesResponse(data));
	} catch (error) {
		handleSoaError(res, error);
	}
}

// Explicit routes (order matters: specific before catch-all)
router.get('/states', getStates);
router.get('/state/:stateCode/counties', getCountiesByStateCode);
router.get('/statecode/:stateCode/countyid/:countyId/nearcounties', getNearbyCountiesByCountyId);
router.get('/state/:stateCode/cities', getCitiesByState);
router.get('/county/:countyId/cities', getCitiesByCountyId);
router.get('/city/:cityId/nearbycities', getNearbyCitiesByCityId);
router.get('/ip/:ipAddress/citylocation', getCityByIP);
router.get('/city/:cityId/neighborhoods', getNeighborhoodsByCityId);
router.get('/state/:stateCode/postalcodes', getZipcodesByStatecode);
router.get('/city/:cityId/postalcodes', getZipcodesByCityId);

/**
 * @swagger
 * /soa/{path}:
 *   get:
 *     summary: Proxy to Geoarea SOA API (GET)
 *     tags:
 *       - SOA Geoarea
 *   post:
 *     summary: Proxy to Geoarea SOA API (POST)
 *     tags:
 *       - SOA Geoarea
 *   delete:
 *     summary: Proxy to Geoarea SOA API (DELETE)
 *     tags:
 *       - SOA Geoarea
 */
async function proxyToGeoarea(req, res) {
	try {
		const path = req.path;
		if (!path || path === '/') {
			res.status(404).json({ error: 'SOA path required' });
			return;
		}
		const method = req.method;
		const options = { query: req.query };
		if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && req.body) {
			options.body = req.body;
		}
		const data = await fetchFromGeoarea(method, path, options);
		sendJson(res, data);
	} catch (error) {
		handleSoaError(res, error);
	}
}

router.get('*', proxyToGeoarea);
router.post('*', proxyToGeoarea);
router.delete('*', proxyToGeoarea);

export default router;
