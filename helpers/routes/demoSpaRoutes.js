/**
 * Shared demo SPA URL patterns for server routes and client Router.
 * Sitemap routes stay in server/routes/demo.js; update patterns here for detail/map/grid.
 */

export const DEMO_SEG = {
	STATE: '[a-z]{2}',
	ZIP_OR_SLUG: '[0-9a-z-]+',
	GUID: '[0-9a-z-]+',
	GEO_SLUG: '[^/]+',
	MAP_COORD: '@[^/]+,[^/]+',
	/** Tail after /demo for geo catch-all (slugs, map coords, underscores). */
	GEO_TAIL: '[/0-9a-zA-Z_@.,\\-]+',
};

const { STATE, ZIP_OR_SLUG, GUID, GEO_SLUG, MAP_COORD, GEO_TAIL } = DEMO_SEG;

/** @type {Record<string, { source: string, paramNames: string[], prIdParamIndex?: number }>} */
export const DEMO_SPA_ROUTES = {
	detail: {
		source: `^/demo/detail/(${STATE})/(${ZIP_OR_SLUG})/(${GUID})/?$`,
		paramNames: ['state', 'zip', 'prId'],
		prIdParamIndex: 2,
	},
	map: {
		source: `^/demo/(${STATE})/(${GEO_SLUG})/(${MAP_COORD})/?$`,
		paramNames: ['state', 'geoSlug', 'coords'],
	},
	geo: {
		source: `^/demo(${GEO_TAIL})/?$`,
		paramNames: ['tail'],
	},
};

/** Match order: most specific first (detail → map → geo). */
export const DEMO_SPA_ROUTE_ORDER = ['detail', 'map', 'geo'];

const DEFAULT_FLAGS = 'i';

/**
 * @param {'detail' | 'map' | 'geo'} id
 * @param {string} [flags]
 * @returns {RegExp}
 */
export function createDemoSpaRegExp(id, flags = DEFAULT_FLAGS) {
	const route = DEMO_SPA_ROUTES[id];
	if (!route) {
		throw new Error(`Unknown demo SPA route id: ${id}`);
	}
	return new RegExp(route.source, flags);
}

/**
 * @param {string} pathname
 * @param {string} [flags]
 * @returns {{ id: string, params: Record<string, string> } | null}
 */
export function matchDemoSpaRoute(pathname, flags = DEFAULT_FLAGS) {
	if (!pathname) {
		return null;
	}
	for (const id of DEMO_SPA_ROUTE_ORDER) {
		const route = DEMO_SPA_ROUTES[id];
		const reg = new RegExp(route.source, flags);
		const match = pathname.match(reg);
		if (!match) {
			continue;
		}
		/** @type {Record<string, string>} */
		const params = {};
		route.paramNames.forEach((name, index) => {
			params[name] = match[index + 1];
		});
		return { id, params };
	}
	return null;
}

/**
 * Which server-side regex would match first (detail and geo only; map uses geo on server).
 * @param {string} pathname
 * @param {string} [flags]
 * @returns {'detail' | 'geo' | null}
 */
export function matchDemoSpaServerRoute(pathname, flags = DEFAULT_FLAGS) {
	for (const id of ['detail', 'geo']) {
		if (createDemoSpaRegExp(id, flags).test(pathname)) {
			return id;
		}
	}
	return null;
}
