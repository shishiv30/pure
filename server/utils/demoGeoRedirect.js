import { isValidStateCode } from '../../helpers/geo.js';

/**
 * Normalize tail captured after `/demo` (no leading slash; strip trailing slashes).
 */
export function normalizeDemoPathCapture(pathCapture) {
	return String(pathCapture || '')
		.replace(/^\/+/, '')
		.replace(/\/+$/, '');
}

/**
 * @param {import('http').IncomingMessage & { url?: string }} req
 * @param {string} pathname
 */
export function appendPreservedQuery(req, pathname) {
	const url = req.url || '';
	const q = url.indexOf('?');
	return q >= 0 ? pathname + url.slice(q) : pathname;
}

/**
 * SOA-style `city-state` first segment, e.g. round-rock-tx, san-mateo-ca.
 * @returns {{ citySlug: string, state: string } | null}
 */
export function parseSoaCityStateSegment(segment) {
	const m = String(segment).match(/^(.+)-([a-zA-Z]{2})$/);
	if (!m || !isValidStateCode(m[2])) return null;
	return { citySlug: m[1].toLowerCase(), state: m[2].toLowerCase() };
}

/**
 * Neighborhood slug segment (hyphenated) → path segment with `_neighborhood` suffix.
 */
export function toNeighborhoodPathSegment(hoodSegment) {
	const slug = String(hoodSegment).toLowerCase().replace(/_/g, '-');
	return `${slug}_neighborhood`;
}

/**
 * Alternate geo URL shapes → canonical `/demo/...` path for 301.
 *
 * - /demo/austin/tx → /demo/tx/austin
 * - /demo/austin-tx → /demo/tx/austin
 * - /demo/san-mateo-county-ca → /demo/ca/san-mateo_county
 * - /demo/san-mateo-ca/neighborhood-slug → /demo/ca/san-mateo/neighborhood-slug_neighborhood
 *
 * @param {string} demoTail - Capture after `/demo` (may start with /)
 * @returns {string|null} pathname starting with /demo, or null
 */
export function getCanonicalDemoGeoRedirectPath(demoTail) {
	const raw = normalizeDemoPathCapture(demoTail);
	if (!raw) return null;

	const segments = raw.split('/').filter(Boolean);
	let hasTrimmed = false;
	if(segments[0] === 'detail') {
		segments.shift();
		hasTrimmed = true;
	}

	if (segments.length === 2) {
		const a = segments[0];
		const b = segments[1];
		const soaCity = parseSoaCityStateSegment(a);
		if (soaCity && !isValidStateCode(b)) {
			const hood = toNeighborhoodPathSegment(b);
			return `/demo/${soaCity.state}/${soaCity.citySlug}/${hood}`;
		}
		const aLower = a.toLowerCase();
		const bLower = b.toLowerCase();
		if (isValidStateCode(b) && !isValidStateCode(a) && !parseSoaCityStateSegment(a)) {
			return `/demo/${bLower}/${aLower}`;
		}
		if(hasTrimmed) {
			return `/demo/${segments[0]}/${segments[1]}`;
		}
		return null;
	}

	if (segments.length === 1) {
		const one = segments[0];
		const county = one.match(/^(.+)-county-([a-zA-Z]{2})$/);
		if (county && isValidStateCode(county[2])) {
			const state = county[2].toLowerCase();
			const countyBase = county[1].toLowerCase();
			return `/demo/${state}/${countyBase}_county`;
		}
		const city = one.match(/^(.+)-([a-zA-Z]{2})$/);
		if (city && isValidStateCode(city[2]) && !one.includes('-county-')) {
			const state = city[2].toLowerCase();
			const citySlug = city[1].toLowerCase();
			return `/demo/${state}/${citySlug}`;
		}
		if(hasTrimmed) {
			return `/demo/${segments[0]}`;
		}
		return null;
	}

	return null;
}
