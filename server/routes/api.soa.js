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

router.use(express.json());

function sendJson(res, data) {
	res.json(data);
}

function handleSoaError(res, error) {
	console.error('SOA API error:', error);
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
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 required: [state, type]
 *                 properties:
 *                   state:
 *                     type: string
 *                     description: 2-letter state code (e.g. NJ, CA)
 *                     example: NJ
 *                   type:
 *                     type: string
 *                     enum: [state]
 *                   id:
 *                     type: string
 *                     description: Geoarea ID or state code
 *                   path:
 *                     type: string
 *                     description: URL path segment for this state (e.g. nj)
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server or upstream error
 *     tags:
 *       - SOA
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
 *     description: Returns counties in a state, mapped to UI geo model.
 *     parameters:
 *       - in: path
 *         name: stateCode
 *         required: true
 *         description: 2-letter state code
 *         schema:
 *           type: string
 *           example: NJ
 *           pattern: '^[A-Za-z]{2}$'
 *     responses:
 *       200:
 *         description: Array of county geo objects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 required: [state, county, type]
 *                 properties:
 *                   state:
 *                     type: string
 *                     example: NJ
 *                   county:
 *                     type: string
 *                     example: Ocean
 *                   type:
 *                     type: string
 *                     enum: [county]
 *                   id:
 *                     type: string
 *                   path:
 *                     type: string
 *                     example: nj/ocean_county
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server or upstream error
 *     tags:
 *       - SOA
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
 *     description: Returns counties near the given county, mapped to UI geo model.
 *     parameters:
 *       - in: path
 *         name: stateCode
 *         required: true
 *         description: 2-letter state code
 *         schema:
 *           type: string
 *           example: NJ
 *       - in: path
 *         name: countyId
 *         required: true
 *         description: Geoarea county ID
 *         schema:
 *           type: integer
 *           example: 1234
 *     responses:
 *       200:
 *         description: Array of nearby county geo objects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   state:
 *                     type: string
 *                   county:
 *                     type: string
 *                   type:
 *                     type: string
 *                     enum: [county]
 *                   id:
 *                     type: string
 *                   path:
 *                     type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server or upstream error
 *     tags:
 *       - SOA
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
 *     description: Returns cities in a state, mapped to UI geo model.
 *     parameters:
 *       - in: path
 *         name: stateCode
 *         required: true
 *         description: 2-letter state code
 *         schema:
 *           type: string
 *           example: NJ
 *     responses:
 *       200:
 *         description: Array of city geo objects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 required: [state, city, type]
 *                 properties:
 *                   state:
 *                     type: string
 *                     example: NJ
 *                   city:
 *                     type: string
 *                     example: Lakewood
 *                   type:
 *                     type: string
 *                     enum: [city]
 *                   id:
 *                     type: string
 *                     description: Geoarea city ID
 *                   path:
 *                     type: string
 *                     example: nj/lakewood
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server or upstream error
 *     tags:
 *       - SOA
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
 *     description: Returns cities in a county, mapped to UI geo model.
 *     parameters:
 *       - in: path
 *         name: countyId
 *         required: true
 *         description: Geoarea county ID
 *         schema:
 *           type: integer
 *           example: 5405
 *     responses:
 *       200:
 *         description: Array of city geo objects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   state:
 *                     type: string
 *                   city:
 *                     type: string
 *                   type:
 *                     type: string
 *                     enum: [city]
 *                   id:
 *                     type: string
 *                   path:
 *                     type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server or upstream error
 *     tags:
 *       - SOA
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
 *     description: Returns cities near the given city, mapped to UI geo model.
 *     parameters:
 *       - in: path
 *         name: cityId
 *         required: true
 *         description: Geoarea city ID
 *         schema:
 *           type: integer
 *           example: 5405
 *     responses:
 *       200:
 *         description: Array of nearby city geo objects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   state:
 *                     type: string
 *                   city:
 *                     type: string
 *                   type:
 *                     type: string
 *                     enum: [city]
 *                   id:
 *                     type: string
 *                   path:
 *                     type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server or upstream error
 *     tags:
 *       - SOA
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
 *     description: Returns city/location geo for the given IP, mapped to UI geo model. Single object.
 *     parameters:
 *       - in: path
 *         name: ipAddress
 *         required: true
 *         description: IPv4 or IPv6 address
 *         schema:
 *           type: string
 *           example: 192.168.1.1
 *     responses:
 *       200:
 *         description: City geo object for the IP
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                   description: 2-letter state code
 *                 city:
 *                   type: string
 *                   description: City name
 *                 county:
 *                   type: string
 *                   description: County name (if available)
 *                 type:
 *                   type: string
 *                   enum: [city, county, state]
 *                   description: Geo type inferred from IP
 *                 id:
 *                   type: string
 *                 path:
 *                   type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server or upstream error
 *     tags:
 *       - SOA
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
 *     description: Returns neighborhoods in a city, mapped to UI geo model.
 *     parameters:
 *       - in: path
 *         name: cityId
 *         required: true
 *         description: Geoarea city ID
 *         schema:
 *           type: integer
 *           example: 5405
 *     responses:
 *       200:
 *         description: Array of neighborhood geo objects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 required: [state, city, neighborhood, type]
 *                 properties:
 *                   state:
 *                     type: string
 *                     example: NJ
 *                   city:
 *                     type: string
 *                     example: Lakewood
 *                   neighborhood:
 *                     type: string
 *                     example: Downtown
 *                   type:
 *                     type: string
 *                     enum: [neighborhood]
 *                   id:
 *                     type: string
 *                     description: Geoarea neighborhood ID
 *                   path:
 *                     type: string
 *                     example: nj/lakewood/downtown_neighborhood
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server or upstream error
 *     tags:
 *       - SOA
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
 *     description: Returns postal codes (zipcodes) in a state, mapped to UI geo model.
 *     parameters:
 *       - in: path
 *         name: stateCode
 *         required: true
 *         description: 2-letter state code
 *         schema:
 *           type: string
 *           example: NJ
 *     responses:
 *       200:
 *         description: Array of zipcode geo objects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 required: [state, zipcode, type]
 *                 properties:
 *                   state:
 *                     type: string
 *                     example: NJ
 *                   zipcode:
 *                     type: string
 *                     example: 08701
 *                   city:
 *                     type: string
 *                     description: City name (if available)
 *                   type:
 *                     type: string
 *                     enum: [zipcode]
 *                   id:
 *                     type: string
 *                   path:
 *                     type: string
 *                     example: nj/08701
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server or upstream error
 *     tags:
 *       - SOA
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
 *     description: Returns postal codes (zipcodes) in a city, mapped to UI geo model.
 *     parameters:
 *       - in: path
 *         name: cityId
 *         required: true
 *         description: Geoarea city ID
 *         schema:
 *           type: integer
 *           example: 5405
 *     responses:
 *       200:
 *         description: Array of zipcode geo objects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   state:
 *                     type: string
 *                   zipcode:
 *                     type: string
 *                   city:
 *                     type: string
 *                   type:
 *                     type: string
 *                     enum: [zipcode]
 *                   id:
 *                     type: string
 *                   path:
 *                     type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server or upstream error
 *     tags:
 *       - SOA
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

// --- Routes (order matters: specific routes before catch-all) ---

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
 *     description: Forwards any GET path to Geoarea. See docs/soa-api.md for full API list.
 *     parameters:
 *       - in: path
 *         name: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Geoarea path (e.g. state/nj/cities, city/5405/neighborhoods)
 *     tags:
 *       - SOA
 *   post:
 *     summary: Proxy to Geoarea SOA API (POST)
 *     description: Forwards any POST path with JSON body to Geoarea.
 *     parameters:
 *       - in: path
 *         name: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     tags:
 *       - SOA
 *   delete:
 *     summary: Proxy to Geoarea SOA API (DELETE)
 *     parameters:
 *       - in: path
 *         name: path
 *         required: true
 *         schema:
 *           type: string
 *     tags:
 *       - SOA
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
