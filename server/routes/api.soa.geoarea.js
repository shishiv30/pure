import express from 'express';
import { fetchStatesFromGeoarea, fetchFromGeoarea } from '../configs/realestate.js';
import {
	mapSoaStatesResponse,
	mapSoaCountiesResponse,
	mapSoaCitiesResponse,
	mapSoaNeighborhoodsResponse,
	mapSoaZipcodesResponse,
	mapSoaSingleItemResponse,
} from '../../helpers/geo.js';

const router = express.Router();

function sendJson(res, data) {
	res.json(data);
}

function handleSoaError(res, error) {
	console.error('SOA Geoarea API error:', error);
	const status = error.message === 'SOA path required' ? 400 : 500;
	const match = error.message?.match(/: (\d{3}) /);
	const fallbackStatus = match ? Number(match[1]) : status;
	res.status(fallbackStatus).json({ error: error.message || 'Internal server error' });
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
export async function getStates() {
	return fetchStatesFromGeoarea();
}

async function getStatesHandler(req, res) {
	try {
		sendJson(res, mapSoaStatesResponse(await getStates()));
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
export async function getCountiesByStateCode(stateCode, query = {}) {
	return fetchFromGeoarea('GET', `/state/${stateCode}/counties`, { query });
}

async function getCountiesByStateCodeHandler(req, res) {
	try {
		sendJson(res, mapSoaCountiesResponse(await getCountiesByStateCode(req.params.stateCode, req.query)));
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
export async function getNearbyCountiesByCountyId(stateCode, countyId, query = {}) {
	return fetchFromGeoarea('GET', `/statecode/${stateCode}/countyid/${countyId}/nearcounties`, {
		query,
	});
}

async function getNearbyCountiesByCountyIdHandler(req, res) {
	try {
		const { stateCode, countyId } = req.params;
		sendJson(
			res,
			mapSoaCountiesResponse(await getNearbyCountiesByCountyId(stateCode, countyId, req.query)),
		);
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
export async function getCitiesByState(stateCode, query = {}) {
	return fetchFromGeoarea('GET', `/state/${stateCode}/cities`, { query });
}

async function getCitiesByStateHandler(req, res) {
	try {
		sendJson(res, mapSoaCitiesResponse(await getCitiesByState(req.params.stateCode, req.query)));
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
export async function getCitiesByCountyId(countyId, query = {}) {
	return fetchFromGeoarea('GET', `/county/${countyId}/cities`, { query });
}

async function getCitiesByCountyIdHandler(req, res) {
	try {
		sendJson(res, mapSoaCitiesResponse(await getCitiesByCountyId(req.params.countyId, req.query)));
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
export async function getNearbyCitiesByCityId(cityId, query = {}) {
	return fetchFromGeoarea('GET', `/city/${cityId}/nearbycities`, { query });
}

async function getNearbyCitiesByCityIdHandler(req, res) {
	try {
		sendJson(res, mapSoaCitiesResponse(await getNearbyCitiesByCityId(req.params.cityId, req.query)));
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
export async function getCityByIP(ipAddress, query = {}) {
	return fetchFromGeoarea('GET', `/ip/${ipAddress}/citylocation`, { query });
}

async function getCityByIPHandler(req, res) {
	try {
		const data = await getCityByIP(req.params.ipAddress, req.query);
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
export async function getNeighborhoodsByCityId(cityId, query = {}) {
	return fetchFromGeoarea('GET', `/city/${cityId}/neighborhoods`, { query });
}

async function getNeighborhoodsByCityIdHandler(req, res) {
	try {
		sendJson(
			res,
			mapSoaNeighborhoodsResponse(await getNeighborhoodsByCityId(req.params.cityId, req.query)),
		);
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
export async function getZipcodesByStatecode(stateCode, query = {}) {
	return fetchFromGeoarea('GET', `/state/${stateCode}/postalcodes`, { query });
}

async function getZipcodesByStatecodeHandler(req, res) {
	try {
		sendJson(
			res,
			mapSoaZipcodesResponse(await getZipcodesByStatecode(req.params.stateCode, req.query)),
		);
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
export async function getZipcodesByCityId(cityId, query = {}) {
	return fetchFromGeoarea('GET', `/city/${cityId}/postalcodes`, { query });
}

async function getZipcodesByCityIdHandler(req, res) {
	try {
		sendJson(res, mapSoaZipcodesResponse(await getZipcodesByCityId(req.params.cityId, req.query)));
	} catch (error) {
		handleSoaError(res, error);
	}
}

// Explicit routes (order matters: specific before catch-all)
router.get('/states', getStatesHandler);
router.get('/state/:stateCode/counties', getCountiesByStateCodeHandler);
router.get('/statecode/:stateCode/countyid/:countyId/nearcounties', getNearbyCountiesByCountyIdHandler);
router.get('/state/:stateCode/cities', getCitiesByStateHandler);
router.get('/county/:countyId/cities', getCitiesByCountyIdHandler);
router.get('/city/:cityId/nearbycities', getNearbyCitiesByCityIdHandler);
router.get('/ip/:ipAddress/citylocation', getCityByIPHandler);
router.get('/city/:cityId/neighborhoods', getNeighborhoodsByCityIdHandler);
router.get('/state/:stateCode/postalcodes', getZipcodesByStatecodeHandler);
router.get('/city/:cityId/postalcodes', getZipcodesByCityIdHandler);

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
export async function proxyToGeoarea(method, path, options = {}) {
	if (!path || path === '/') {
		throw new Error('SOA path required');
	}
	return fetchFromGeoarea(method, path, options);
}

async function proxyToGeoareaHandler(req, res) {
	try {
		const method = req.method;
		const options = { query: req.query };
		if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && req.body) {
			options.body = req.body;
		}
		sendJson(res, await proxyToGeoarea(method, req.path, options));
	} catch (error) {
		handleSoaError(res, error);
	}
}

router.get('*', proxyToGeoareaHandler);
router.post('*', proxyToGeoareaHandler);
router.delete('*', proxyToGeoareaHandler);

export default router;
