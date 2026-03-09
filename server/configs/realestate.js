import config from '../config.js';

/**
 * Default headers for Geoarea SOA API. Uses X-MData-Key from config (SOA_API_KEY).
 */
function getGeoareaHeaders() {
	const headers = { 'Content-Type': 'application/json' };
	if (config.geoareaApiKey) {
		headers['X-MData-Key'] = config.geoareaApiKey;
	}
	return headers;
}

/**
 * Fetch states from Geoarea SOA API. Returns [] on failure so callers can fall back.
 * @returns {Promise<Array<{ stateCode?: string, name?: string, [key: string]: unknown }>>}
 */
export async function fetchStatesFromGeoarea() {
	try {
		if (!config.geoareaApiDomain) {
			throw new Error('GEOAREA_API_DOMAIN is required');
		}

		const response = await fetch(`${config.geoareaApiDomain}/states`, {
			method: 'GET',
			headers: getGeoareaHeaders(),
		});

		if (!response.ok) {
			throw new Error(`Geoarea API request failed: ${response.status} ${response.statusText}`);
		}

		const result = await response.json();

		// Support both { data: [...] } and direct array
		if (Array.isArray(result)) {
			return result;
		}
		if (result?.data && Array.isArray(result.data)) {
			return result.data;
		}
		throw new Error('Invalid response from Geoarea API: expected array or { data: array }');
	} catch (error) {
		console.error('Error fetching states from Geoarea:', error);
		return [];
	}
}

/**
 * Call any Geoarea SOA API by method and path. Returns parsed JSON or throws.
 * @param {string} method - GET, POST, DELETE, etc.
 * @param {string} path - Path including leading slash (e.g. /state/nj/cities). Do not include query.
 * @param {Object} [options] - Optional. query: object for query string; body: object for POST body.
 * @returns {Promise<unknown>}
 */
export async function fetchFromGeoarea(method, path, options = {}) {
	if (!config.geoareaApiDomain) {
		throw new Error('GEOAREA_API_DOMAIN is required');
	}
	const base = config.geoareaApiDomain.replace(/\/$/, '');
	const pathStr = path.startsWith('/') ? path : `/${path}`;
	let urlStr = `${base}${pathStr}`;
	if (options.query && typeof options.query === 'object') {
		const params = new URLSearchParams();
		Object.entries(options.query).forEach(([k, v]) => {
			if (v !== undefined && v !== '') params.set(k, String(v));
		});
		const q = params.toString();
		if (q) urlStr += `?${q}`;
	}
	const init = {
		method: method.toUpperCase(),
		headers: getGeoareaHeaders(),
	};
	if (options.body != null && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
		init.body = JSON.stringify(options.body);
	}
	const response = await fetch(urlStr, init);
	if (!response.ok) {
		throw new Error(`Geoarea API ${method} ${path}: ${response.status} ${response.statusText}`);
	}
	const text = await response.text();
	if (!text || text.trim() === '') return null;
	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
}

export default {
	fetchStatesFromGeoarea,
	fetchFromGeoarea,
};
