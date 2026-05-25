import express from 'express';
import config from '../config.js';
import { fetchFromSoa } from '../controllers/realestate.js';

const router = express.Router();
router.use(express.json());

function sendJson(res, data) {
	res.json(data);
}

function getPropertyApiDomain() {
	if (!config.propertyApiDomain) {
		throw new Error('PROPERTY_API_DOMAIN is not configured');
	}
	return config.propertyApiDomain;
}

function handleSoaError(res, error) {
	console.error('SOA Property API error:', error);
	const status =
		error.message === 'PROPERTY_API_DOMAIN is not configured'
			? 503
			: error.message === 'propertyId is required' ||
					error.message === 'prId is required' ||
					error.message === 'Property API path required'
				? 400
				: 500;
	const match = error.message?.match(/: (\d{3}) /);
	const fallbackStatus = match ? Number(match[1]) : status;
	res.status(fallbackStatus).json({ error: error.message || 'Internal server error' });
}


export function getFilterByPayloadFilter(payload) {
	//todo maapping
	let filter = {
			ojoAttribute: [],
			coordinates: '',
			minBed: 0,
			maxBed: 0,
			minBath: 0,
			maxBath: 0,
			soldDateRange: 0,
			minPrice: 0,
			maxPrice: 0,
			propertyType: [],
			minHouseSize: 0,
			maxHouseSize: 0,
			minLotSize: 0,
			maxLotSize: 0,
			minYearBuild: 0,
			maxYearBuild: 0,
			minDOM: 0,
			maxDOM: 0,
			minHoa: -1,
			maxHoa: -1,
			pool: 0,
			fixerupper: 0,
			isActive: 1,
			updateNew: 0,
			propertyCriteriaLuxuryHome: 0,
			propertyCriteriaOpenHouse: 0,
			updatePriceReduced: 0,
			updateVirtualTour: 0,
			updateNewConstruction: 0,
			propertyCriteriaForeclosed: 0,
			propertyListedMovoto: 0,
			hidePending: 0,
			photos: 0,
			garage: 0,
			sort: null,
			schoolHigh: 0,
			schoolMiddle: 0,
			schoolElementary: 0,
			schoolPre: 0,
			schoolPublic: 0,
			schoolCharter: 0,
			schoolPrivate: 0,
			schoolMinRate: 1,
			schoolIncludeUnrated: 1,
			schoolId: null,
			rentals: 0,
	};
	if (payload.minPrice !== undefined) {
			filter.minPrice = payload.minPrice;
	}
	if (payload.maxPrice !== undefined) {
			filter.maxPrice = payload.maxPrice;
	}
	if (payload.minBed !== undefined) {
			filter.minBed = payload.minBed;
	}
	if (payload.maxBed !== undefined) {
			filter.maxBed = payload.maxBed;
	}
	if (payload.minBath !== undefined) {
			filter.minBath = payload.minBath;
	}
	if (payload.maxBath !== undefined) {
			filter.maxBath = payload.maxBath;
	}
	if (payload.propertyTypes && payload.propertyTypes.length > 0) {
			filter.propertyType = payload.propertyTypes.map((e) => propertyTypes[e] || e);
	}
	if (payload.minSqft !== undefined) {
			filter.minHouseSize = payload.minSqft;
	}
	if (payload.maxSqft !== undefined) {
			filter.maxHouseSize = payload.maxSqft;
	}
	if (payload.minLot !== undefined) {
			filter.minLotSize = payload.minLot;
	}
	if (payload.maxLot !== undefined) {
			filter.maxLotSize = payload.maxLot;
	}
	if (payload.minYear !== undefined) {
			filter.minYearBuild = payload.minYear;
	}
	if (payload.maxYear !== undefined) {
			filter.maxYearBuild = payload.maxYear;
	}
	if (payload.minDom !== undefined) {
			filter.minDOM = payload.minDom;
	}
	if (payload.maxDom !== undefined) {
			filter.maxDOM = payload.maxDom;
	}
	if (payload.minHoa !== undefined) {
			filter.minHoa = payload.minHoa;
	}
	if (payload.maxHoa !== undefined) {
			filter.maxHoa = payload.maxHoa;
	}
	if (payload.attributesTags && payload.attributesTags.length > 0) {
			filter.ojoAttribute = payload.attributesTags;
			if (payload.attributesTags.indexOf('pool') > -1) {
					filter.pool = 1;
			}

			if (payload.attributesTags.indexOf('garage') > -1) {
					filter.garage = 1;
			}
	}
	if (payload.isNewListingsOnly !== undefined) {
			filter.updateNew = payload.isNewListingsOnly;
	}
	if (payload.isReducedPrice !== undefined) {
			filter.updatePriceReduced = payload.isReducedPrice;
	}
	if (payload.isVirtualTourLinkOnly !== undefined) {
			filter.updateVirtualTour = payload.isVirtualTourLinkOnly;
	}

	if (payload.hasVideo !== undefined) {
			filter.hasVideo = payload.hasVideo;
	}

	if (payload.isNewConstruction !== undefined) {
			filter.updateNewConstruction = payload.isNewConstruction;
	}
	if (payload.isDistressed !== undefined) {
			filter.propertyCriteriaForeclosed = payload.isDistressed;
	}
	if (payload.isOpenHousesOnly !== undefined) {
			filter.propertyCriteriaOpenHouse = payload.isOpenHousesOnly;
	}
	if (payload.movotoListing !== undefined) {
			filter.propertyListedMovoto = payload.movotoListing;
	}
	if (payload.hasPhoto !== undefined) {
			filter.photos = payload.hasPhoto;
	}

	if (payload.sortColumn && payload.sortOrder) {
			filter.sort = 'sortby-' + payload.sortColumn + '-' + payload.sortOrder;
	}

	if (payload.searchPropertyStatus !== undefined) {
			if (payload.searchPropertyStatus === 'FOR_RENT') {
					filter.rentals = 1;
			} else if (payload.searchPropertyStatus === 'INACTIVE') {
					filter.isActive = 0;
					if (payload.soldDateRange) {
							filter.soldDateRange = payload.soldDateRange;
					}
			} else if (payload.searchPropertyStatus === 'ACTIVE') {
					filter.hidePending = 1;
			}
	}
	if (payload.schoolRequest && payload.schoolRequest.length > 0) {
			let school = payload.schoolRequest[0];
			filter.schoolId = school.schoolId;
			filter.schoolHigh = school.schoolLevel === 'HIGH' ? 1 : 0;
			filter.schoolMiddle = school.schoolLevel === 'MIDDLE' ? 1 : 0;
			filter.schoolElementary = school.schoolLevel === 'ELEMENTARY' ? 1 : 0;
			filter.schoolPre = school.schoolLevel === 'PRE_SCHOOL' ? 1 : 0;
			filter.schoolPublic = school.schoolType === 'PUBLIC' ? 1 : 0;
			filter.schoolCharter = school.schoolType === 'CHARTER' ? 1 : 0;
			filter.schoolPrivate = school.schoolType === 'PRIVATE' ? 1 : 0;
			filter.schoolMinRate = school.minRating;
			filter.schoolIncludeUnrated = school.includeUnrated ? 1 : 0;
	}
	if (payload.pageIndex !== undefined) {
			filter.pageIndex = payload.pageIndex;
	}
	if (payload.maxCountPerPage !== undefined) {
			filter.pageSize = payload.maxCountPerPage;
	}
	if (payload.maxLat && payload.minLat && payload.maxLng && payload.minLng) {
			filter.coordinates = {
					ne: {
							lat: payload.maxLat,
							lng: payload.maxLng,
					},
					sw: {
							lat: payload.minLat,
							lng: payload.minLng,
					},
			};
	}
	return filter;
}

export function getPayloadByFilter(filter = {}) {
	const payload = {};

	if (filter.minPrice !== undefined) {
		payload.minPrice = filter.minPrice;
	}
	if (filter.maxPrice !== undefined) {
		payload.maxPrice = filter.maxPrice;
	}
	if (filter.minBed !== undefined) {
		payload.minBed = filter.minBed;
	}
	if (filter.maxBed !== undefined) {
		payload.maxBed = filter.maxBed;
	}
	if (filter.minBath !== undefined) {
		payload.minBath = filter.minBath;
	}
	if (filter.maxBath !== undefined) {
		payload.maxBath = filter.maxBath;
	}
	if (Array.isArray(filter.propertyType) && filter.propertyType.length > 0) {
		payload.propertyTypes = filter.propertyType;
	}
	if (filter.minHouseSize !== undefined) {
		payload.minSqft = filter.minHouseSize;
	}
	if (filter.maxHouseSize !== undefined) {
		payload.maxSqft = filter.maxHouseSize;
	}
	if (filter.minLotSize !== undefined) {
		payload.minLot = filter.minLotSize;
	}
	if (filter.maxLotSize !== undefined) {
		payload.maxLot = filter.maxLotSize;
	}
	if (filter.minYearBuild !== undefined) {
		payload.minYear = filter.minYearBuild;
	}
	if (filter.maxYearBuild !== undefined) {
		payload.maxYear = filter.maxYearBuild;
	}
	if (filter.minDOM !== undefined) {
		payload.minDom = filter.minDOM;
	}
	if (filter.maxDOM !== undefined) {
		payload.maxDom = filter.maxDOM;
	}
	if (filter.minHoa !== undefined) {
		payload.minHoa = filter.minHoa;
	}
	if (filter.maxHoa !== undefined) {
		payload.maxHoa = filter.maxHoa;
	}

	const attributesTags = Array.isArray(filter.ojoAttribute) ? [...filter.ojoAttribute] : [];
	if (filter.pool && attributesTags.indexOf('pool') === -1) {
		attributesTags.push('pool');
	}
	if (filter.garage && attributesTags.indexOf('garage') === -1) {
		attributesTags.push('garage');
	}
	if (attributesTags.length > 0) {
		payload.attributesTags = attributesTags;
	}

	if (filter.updateNew !== undefined) {
		payload.isNewListingsOnly = filter.updateNew;
	}
	if (filter.updatePriceReduced !== undefined) {
		payload.isReducedPrice = filter.updatePriceReduced;
	}
	if (filter.updateVirtualTour !== undefined) {
		payload.isVirtualTourLinkOnly = filter.updateVirtualTour;
	}
	if (filter.hasVideo !== undefined) {
		payload.hasVideo = filter.hasVideo;
	}
	if (filter.updateNewConstruction !== undefined) {
		payload.isNewConstruction = filter.updateNewConstruction;
	}
	if (filter.propertyCriteriaForeclosed !== undefined) {
		payload.isDistressed = filter.propertyCriteriaForeclosed;
	}
	if (filter.propertyCriteriaOpenHouse !== undefined) {
		payload.isOpenHousesOnly = filter.propertyCriteriaOpenHouse;
	}
	if (filter.propertyListedMovoto !== undefined) {
		payload.movotoListing = filter.propertyListedMovoto;
	}
	if (filter.photos !== undefined) {
		payload.hasPhoto = filter.photos;
	}

	if (typeof filter.sort === 'string' && filter.sort.indexOf('sortby-') === 0) {
		const sortTokens = filter.sort.split('-');
		if (sortTokens.length >= 3) {
			payload.sortColumn = sortTokens[1];
			payload.sortOrder = sortTokens.slice(2).join('-');
		}
	}

	if (filter.rentals === 1) {
		payload.searchPropertyStatus = 'FOR_RENT';
	} else if (filter.isActive === 0) {
		payload.searchPropertyStatus = 'INACTIVE';
		if (filter.soldDateRange) {
			payload.soldDateRange = filter.soldDateRange;
		}
	} else if (filter.hidePending === 1) {
		payload.searchPropertyStatus = 'ACTIVE';
	}

	if (filter.schoolId) {
		let schoolLevel = null;
		if (filter.schoolHigh === 1) {
			schoolLevel = 'HIGH';
		} else if (filter.schoolMiddle === 1) {
			schoolLevel = 'MIDDLE';
		} else if (filter.schoolElementary === 1) {
			schoolLevel = 'ELEMENTARY';
		} else if (filter.schoolPre === 1) {
			schoolLevel = 'PRE_SCHOOL';
		}

		let schoolType = null;
		if (filter.schoolPublic === 1) {
			schoolType = 'PUBLIC';
		} else if (filter.schoolCharter === 1) {
			schoolType = 'CHARTER';
		} else if (filter.schoolPrivate === 1) {
			schoolType = 'PRIVATE';
		}

		payload.schoolRequest = [
			{
				schoolId: filter.schoolId,
				schoolLevel,
				schoolType,
				minRating: filter.schoolMinRate,
				includeUnrated: filter.schoolIncludeUnrated === 1,
			},
		];
	}

	if (filter.pageIndex !== undefined) {
		payload.pageIndex = filter.pageIndex;
	}
	if (filter.pageSize !== undefined) {
		payload.maxCountPerPage = filter.pageSize;
	}
	if (
		filter.coordinates &&
		filter.coordinates.ne &&
		filter.coordinates.sw &&
		filter.coordinates.ne.lat !== undefined &&
		filter.coordinates.ne.lng !== undefined &&
		filter.coordinates.sw.lat !== undefined &&
		filter.coordinates.sw.lng !== undefined
	) {
		payload.maxLat = filter.coordinates.ne.lat;
		payload.maxLng = filter.coordinates.ne.lng;
		payload.minLat = filter.coordinates.sw.lat;
		payload.minLng = filter.coordinates.sw.lng;
	}

	return payload;
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
export async function getPropertyByPath(queryParams = {}) {
	// Remap: path -> url for SOA /mlsPublicRecordAssociations/url
	const query = { ...queryParams };
	if (query.path !== undefined && query.url === undefined) {
		query.url = query.path;
		delete query.path;
	}
	return proxyToPropertyPath('GET', '/mlsPublicRecordAssociations/url', { query });
}

async function getPropertyByPathHandler(req, res) {
	try {
		sendJson(res, await getPropertyByPath(req.query));
	} catch (error) {
		handleSoaError(res, error);
	}
}

/**
 * @swagger
 * /soa/property/getPropertyHistoryById:
 *   get:
 *     summary: Get property history by prId (query)
 *     description: Proxies to SOA GET /properties/{prId}/histories. Pass prId in query.
 *     parameters:
 *       - in: query
 *         name: prId
 *         required: true
 *         schema:
 *           type: string
 *           example: "45a6f0ff-21ec-45f6-8a35-69de1bc9368d"
 *         description: MLS public record id
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
 *         description: prId is required
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
 * /soa/property/getPropertyHistoryById/{prId}:
 *   get:
 *     summary: Get property history by prId (path)
 *     description: Proxies to SOA GET /properties/{prId}/histories. Pass prId in path.
 *     parameters:
 *       - in: path
 *         name: prId
 *         required: true
 *         schema:
 *           type: string
 *           example: "45a6f0ff-21ec-45f6-8a35-69de1bc9368d"
 *         description: MLS public record id
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
 *         description: prId is required
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
export async function getPropertyHistoryById(prId, queryParams = {}) {
	if (!prId) {
		throw new Error('prId is required');
	}
	const query = { ...queryParams };
	delete query.prId;
	return proxyToPropertyPath('GET', `/properties/${prId}/histories`, { query });
}

async function getPropertyHistoryByIdHandler(req, res) {
	try {
		const prId = req.params.prId ?? req.query.prId;
		sendJson(res, await getPropertyHistoryById(prId, req.query));
	} catch (error) {
		handleSoaError(res, error);
	}
}

/**
 * @swagger
 * /soa/property/getPropertyListingInfoById:
 *   get:
 *     summary: Get property primary listing info by ID (v2, query)
 *     description: Proxies to SOA GET /properties/{propertyId}/primary-listing. Pass propertyId in query.
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
 *     description: Proxies to SOA GET /properties/{propertyId}/primary-listing. Pass propertyId in path.
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
export async function getPropertyListingInfoById(propertyId, queryParams = {}) {
	if (!propertyId) {
		throw new Error('propertyId is required');
	}
	const query = { ...queryParams };
	delete query.propertyId;
	return proxyToPropertyPath('GET', `/properties/${propertyId}/primary-listing`, {
		query,
	});
}

async function getPropertyListingInfoByIdHandler(req, res) {
	try {
		const propertyId = req.params.propertyId ?? req.query.propertyId;
		sendJson(res, await getPropertyListingInfoById(propertyId, req.query));
	} catch (error) {
		handleSoaError(res, error);
	}
}


function getSearchInputByGeo(geo = {}) {
	if(!geo){
		return '';
	}
	if (geo.zipcode && geo.state) {
		return `${geo.zipcode} ${geo.state}`;
	}
	if (geo.neighborhood && geo.city && geo.state) {
		return `${geo.neighborhood} ${geo.city} ${geo.state}`;
	}
	if (geo.city && geo.state) {
		return `${geo.city} ${geo.state}`;
	}
	if (geo.county && geo.state) {
		return `${geo.county} ${geo.state}`;
	}
	if (geo.state) {
		return geo.state;
	}
	return '';
}

function getSearchHousePayload(geo, filter = { pageSize: 50, pageIndex: 1 }) {
	let body = {
		input: getSearchInputByGeo(geo),
		searchType: geo?.type?.toUpperCase(),
	};
	if (filter) {
		Object.assign(body, getPayloadByFilter(filter));
	}
	return body;
}


/**
 * @swagger
 * /soa/property/searchHouse:
 *   post:
 *     summary: Search house (nearby search v2)
 *     description: Wraps searchHouse and proxies to SOA POST /listings/nearbysearch/v2.
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               geo:
 *                 type: object
 *                 description: Geo input with state/city/county/zipcode/neighborhood and optional type.
 *                 additionalProperties: true
 *               filter:
 *                 type: object
 *                 description: Optional search filters mapped by getFilterByPayloadFilter.
 *                 additionalProperties: true
 *             description: searchHouse wrapper payload.
 *           example:
 *             geo:
 *               city: Austin
 *               state: TX
 *               type: city
 *             filter:
 *               pageSize: 5
 *               pageIndex: 1
 *               minPrice: 100000
 *               minBed: 1
 *               minBath: 2
 *               propertyTypes: ['SINGLE_FAMILY', 'CONDO']
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
export async function searchHouse(geo, filter = null, query = {}) {
	const body = getSearchHousePayload(geo, filter);
	return proxyToPropertyPath('POST', '/listings/nearbysearch/v2', {
		body,
		query,
	});
}

async function searchHouseHandler(req, res) {
	try {
		const body = req.body && typeof req.body === 'object' ? req.body : {};
		const geo = body.geo && typeof body.geo === 'object' ? body.geo : body;
		const filter = body.filter && typeof body.filter === 'object' ? body.filter : null;
		sendJson(res, await searchHouse(geo, filter, req.query));
	} catch (error) {
		handleSoaError(res, error);
	}
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
export async function getNearbyForSaleHouseByLocation(query = {}) {
	return proxyToPropertyPath('GET', '/listings/nearbysearch/v2', { query });
}

async function getNearbyForSaleHouseByLocationHandler(req, res) {
	try {
		sendJson(res, await getNearbyForSaleHouseByLocation(req.query));
	} catch (error) {
		handleSoaError(res, error);
	}
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
export async function getNearbySoldHouseByLocation(query = {}) {
	return proxyToPropertyPath('GET', '/listings/nearbysoldsearch', { query });
}

async function getNearbySoldHouseByLocationHandler(req, res) {
	try {
		sendJson(res, await getNearbySoldHouseByLocation(req.query));
	} catch (error) {
		handleSoaError(res, error);
	}
}

export async function proxyToPropertyPath(method, path, overrides = {}) {
	const domain = getPropertyApiDomain();
	const options = {
		query: overrides.query ?? {},
		...(overrides.body !== undefined && { body: overrides.body }),
	};
	return fetchFromSoa(domain, method, path, options);
}

router.get('/getPropertyByPath', getPropertyByPathHandler);
router.get('/getPropertyHistoryById', getPropertyHistoryByIdHandler);
router.get('/getPropertyHistoryById/:prId', getPropertyHistoryByIdHandler);
router.get('/getPropertyListingInfoById', getPropertyListingInfoByIdHandler);
router.get('/getPropertyListingInfoById/:propertyId', getPropertyListingInfoByIdHandler);
router.post('/searchHouse', searchHouseHandler);
router.get('/getNearbyForSaleHouseByLocation', getNearbyForSaleHouseByLocationHandler);
router.get('/getNearbySoldHouseByLocation', getNearbySoldHouseByLocationHandler);

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
export async function proxyToProperty(method, path, options = {}) {
	const domain = getPropertyApiDomain();
	if (!path || path === '/') {
		throw new Error('Property API path required');
	}
	return fetchFromSoa(domain, method, path, options);
}

async function proxyToPropertyHandler(req, res) {
	try {
		const method = req.method;
		const options = { query: req.query };
		if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && req.body) {
			options.body = req.body;
		}
		sendJson(res, await proxyToProperty(method, req.path, options));
	} catch (error) {
		handleSoaError(res, error);
	}
}

router.get('*', proxyToPropertyHandler);
router.post('*', proxyToPropertyHandler);
router.put('*', proxyToPropertyHandler);
router.delete('*', proxyToPropertyHandler);

export default router;
