import {
	geoType,
	getStatePath,
	getCityPath,
	getCountyPath,
	getZipcodePath,
	getNeighborhoodPath,
} from './geo.js';
import { getStateCode } from './stateDict.js';

/**
 * UI geo model: { state, city?, county?, zipcode?, type, id?, path? }
 * Normalizes SOA/Geoarea API items to this shape.
 */

function pickStateCode(item) {
	return item.stateCode ?? item.state ?? item.code ?? '';
}

function pickStateName(item) {
	return item.stateName ?? item.name ?? item.state ?? '';
}

function pickCityName(item) {
	return item.cityName ?? item.city ?? item.name ?? '';
}

function pickCountyName(item) {
	return item.countyName ?? item.county ?? item.name ?? '';
}

function pickZipcode(item) {
	return item.zipcode ?? item.zip ?? item.zipCode ?? item.code ?? '';
}

function pickNeighborhoodName(item) {
	return item.name ?? item.neighborhood ?? item.neighborhoodName ?? '';
}

/**
 * Map a single SOA state item to UI geo model.
 * @param {Object} item - Raw state from Geoarea API (e.g. stateCode, name / stateName)
 * @returns {{ state: string, type: string, id?: string, path?: string }}
 */
export function mapSoaStateToGeo(item) {
	if (!item) return null;
	const rawCode = pickStateCode(item).toString().trim();
	const rawName = pickStateName(item).toString().trim();
	const state =
		rawCode.length === 2
			? rawCode.toUpperCase()
			: getStateCode(rawName) || rawCode || rawName;
	const id = item.id ?? item.stateId ?? state;
	const path = getStatePath(state);
	return {
		state,
		type: geoType.state,
		...(id != null && { id: String(id) }),
		...(path && { path }),
	};
}

/**
 * Map a single SOA city item to UI geo model.
 * @param {Object} item - Raw city from Geoarea API (e.g. cityId, cityName, stateCode)
 * @returns {{ state: string, city: string, type: string, id?: string, path?: string }}
 */
export function mapSoaCityToGeo(item) {
	if (!item) return null;
	const rawState = (pickStateCode(item) || item.state || '').toString().trim();
	const state =
		rawState.length === 2 ? rawState.toUpperCase() : getStateCode(rawState) || rawState;
	const city = pickCityName(item).toString().trim();
	if (!state || !city) return null;
	const id = item.id ?? item.cityId ?? null;
	const path = getCityPath(city, state);
	return {
		state,
		city,
		type: geoType.city,
		...(id != null && { id: String(id) }),
		...(path && { path }),
	};
}

/**
 * Map a single SOA county item to UI geo model.
 * @param {Object} item - Raw county from Geoarea API (e.g. countyId, countyName, stateCode)
 * @returns {{ state: string, county: string, type: string, id?: string, path?: string }}
 */
export function mapSoaCountyToGeo(item) {
	if (!item) return null;
	const rawState = (pickStateCode(item) || item.state || '').toString().trim();
	const state =
		rawState.length === 2 ? rawState.toUpperCase() : getStateCode(rawState) || rawState;
	const county = pickCountyName(item).toString().trim();
	if (!state || !county) return null;
	const id = item.id ?? item.countyId ?? null;
	const path = getCountyPath(county, state);
	return {
		state,
		county,
		type: geoType.county,
		...(id != null && { id: String(id) }),
		...(path && { path }),
	};
}

/**
 * Map a single SOA zipcode item to UI geo model.
 * @param {Object} item - Raw zipcode from Geoarea API
 * @returns {{ state: string, zipcode: string, type: string, city?: string, id?: string, path?: string }}
 */
export function mapSoaZipcodeToGeo(item) {
	if (!item) return null;
	const rawState = (pickStateCode(item) || item.state || '').toString().trim();
	const state =
		rawState.length === 2 ? rawState.toUpperCase() : getStateCode(rawState) || rawState;
	const zipcode = pickZipcode(item).toString().trim();
	if (!state || !zipcode) return null;
	const id = item.id ?? zipcode;
	const path = getZipcodePath(zipcode, state);
	const geo = {
		state,
		zipcode,
		type: geoType.zipcode,
		...(id != null && { id: String(id) }),
		...(path && { path }),
	};
	const city = pickCityName(item);
	if (city) geo.city = city;
	return geo;
}

/**
 * Map a single SOA neighborhood item to UI geo model.
 * @param {Object} item - Raw neighborhood from Geoarea API (name, cityName, stateCode)
 * @returns {{ state: string, city: string, neighborhood: string, type: string, id?: string, path?: string }}
 */
export function mapSoaNeighborhoodToGeo(item) {
	if (!item) return null;
	const rawState = (pickStateCode(item) || item.state || '').toString().trim();
	const state =
		rawState.length === 2 ? rawState.toUpperCase() : getStateCode(rawState) || rawState;
	const city = pickCityName(item).toString().trim();
	const neighborhood = pickNeighborhoodName(item).toString().trim();
	if (!state || !city || !neighborhood) return null;
	const id = item.id ?? item.neighborhoodId ?? null;
	const path = getNeighborhoodPath(neighborhood, city, state);
	return {
		state,
		city,
		neighborhood,
		type: geoType.neighborhood,
		...(id != null && { id: String(id) }),
		...(path && { path }),
	};
}

/**
 * Map SOA state list to UI geo list.
 * @param {Array<Object>} items - Raw state array from Geoarea API
 * @returns {Array<{ state, type, id?, path? }>}
 */
export function mapSoaStatesToGeo(items) {
	if (!Array.isArray(items)) return [];
	return items.map(mapSoaStateToGeo).filter(Boolean);
}

/**
 * Map SOA city list to UI geo list.
 * @param {Array<Object>} items - Raw city array from Geoarea API
 * @returns {Array<{ state, city, type, id?, path? }>}
 */
export function mapSoaCitiesToGeo(items) {
	if (!Array.isArray(items)) return [];
	return items.map(mapSoaCityToGeo).filter(Boolean);
}

/**
 * Map SOA county list to UI geo list.
 * @param {Array<Object>} items - Raw county array from Geoarea API
 * @returns {Array<{ state, county, type, id?, path? }>}
 */
export function mapSoaCountiesToGeo(items) {
	if (!Array.isArray(items)) return [];
	return items.map(mapSoaCountyToGeo).filter(Boolean);
}

/**
 * Map SOA zipcode list to UI geo list.
 * @param {Array<Object>} items - Raw zipcode array from Geoarea API
 * @returns {Array<{ state, zipcode, type, city?, id?, path? }>}
 */
export function mapSoaZipcodesToGeo(items) {
	if (!Array.isArray(items)) return [];
	return items.map(mapSoaZipcodeToGeo).filter(Boolean);
}

/**
 * Map SOA neighborhood list to UI geo list.
 * @param {Array<Object>} items - Raw neighborhood array from Geoarea API
 * @returns {Array<{ state, city, neighborhood, type, id?, path? }>}
 */
export function mapSoaNeighborhoodsToGeo(items) {
	if (!Array.isArray(items)) return [];
	return items.map(mapSoaNeighborhoodToGeo).filter(Boolean);
}

/**
 * Normalize Geoarea API response to array. Handles raw array or { data: array } or { list: array }.
 * @param {unknown} data - Raw Geoarea response
 * @returns {Array<Object>}
 */
function ensureArray(data) {
	if (Array.isArray(data)) return data;
	if (data && typeof data === 'object' && Array.isArray(data.data)) return data.data;
	if (data && typeof data === 'object' && Array.isArray(data.list)) return data.list;
	return [];
}

/**
 * Map raw Geoarea states response to UI geo array.
 * @param {unknown} raw - Raw response from Geoarea /states
 * @returns {Array<{ state: string, type: string, id?: string, path?: string }>}
 */
export function mapSoaStatesResponse(raw) {
	return mapSoaStatesToGeo(ensureArray(raw));
}

/**
 * Map raw Geoarea counties response to UI geo array.
 * @param {unknown} raw - Raw response from Geoarea counties endpoints
 * @returns {Array<{ state: string, county: string, type: string, id?: string, path?: string }>}
 */
export function mapSoaCountiesResponse(raw) {
	return mapSoaCountiesToGeo(ensureArray(raw));
}

/**
 * Map raw Geoarea cities response to UI geo array.
 * @param {unknown} raw - Raw response from Geoarea cities endpoints
 * @returns {Array<{ state: string, city: string, type: string, id?: string, path?: string }>}
 */
export function mapSoaCitiesResponse(raw) {
	return mapSoaCitiesToGeo(ensureArray(raw));
}

/**
 * Map raw Geoarea neighborhoods response to UI geo array.
 * @param {unknown} raw - Raw response from Geoarea neighborhoods endpoint
 * @returns {Array<{ state: string, city: string, neighborhood: string, type: string, id?: string, path?: string }>}
 */
export function mapSoaNeighborhoodsResponse(raw) {
	return mapSoaNeighborhoodsToGeo(ensureArray(raw));
}

/**
 * Map raw Geoarea zipcodes/postalcodes response to UI geo array.
 * @param {unknown} raw - Raw response from Geoarea postalcodes endpoints
 * @returns {Array<{ state: string, zipcode: string, type: string, city?: string, id?: string, path?: string }>}
 */
export function mapSoaZipcodesResponse(raw) {
	return mapSoaZipcodesToGeo(ensureArray(raw));
}

/**
 * Map raw Geoarea single-item response (e.g. city by IP) to UI geo object.
 * Returns null if unmappable; caller can fall back to raw.
 * @param {unknown} raw - Raw response (single object or array)
 * @returns {{ state: string, city?: string, county?: string, type: string, id?: string, path?: string } | null}
 */
export function mapSoaSingleItemResponse(raw) {
	if (!raw || Array.isArray(raw)) return null;
	return mapSoaItemToGeo(raw);
}

/**
 * Map one SOA item to UI geo model { state, city?, county?, ... }.
 * Detects type by which of state/city/county/zipcode fields are present.
 * @param {Object} item - Raw item from Geoarea API
 * @returns {{ state: string, city?: string, county?: string, type: string, id?: string, path?: string } | null}
 */
export function mapSoaItemToGeo(item) {
	if (!item) return null;
	const neighborhood = pickNeighborhoodName(item);
	const county = pickCountyName(item);
	const city = pickCityName(item);
	const zip = pickZipcode(item);
	if (neighborhood && city) return mapSoaNeighborhoodToGeo(item);
	if (county && !city && !zip) return mapSoaCountyToGeo(item);
	if (city) return mapSoaCityToGeo(item);
	if (zip) return mapSoaZipcodeToGeo(item);
	return mapSoaStateToGeo(item);
}
