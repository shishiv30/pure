/**
 * Single utility for CMS vs local data: pass key; if config.cmsHealth use API, else load from data/.
 * Sets config.cmsHealth on first use via /api/health check when cmsUrl is set.
 */
import serverConfig from '../config.js';

/** Safe key for dynamic import: only [a-zA-Z0-9_-] to avoid path traversal */
function safeKey(key) {
	if (typeof key !== 'string') return '';
	return key.replace(/[^a-zA-Z0-9_-]/g, '');
}

/**
 * Ensure config.cmsHealth is set; when undefined, ping CMS /api/health and cache result.
 * @returns {Promise<boolean>} true to use CMS API, false to use local data
 */
async function useCms() {
	if (serverConfig.cmsHealth !== undefined) return serverConfig.cmsHealth === true;
	if (!serverConfig.cmsUrl) {
		serverConfig.cmsHealth = false;
		return false;
	}
	try {
		const res = await fetch(`${serverConfig.cmsUrl}/health`);
		serverConfig.cmsHealth = res.ok;
		return serverConfig.cmsHealth;
	} catch (err) {
		console.error('CMS health check failed: start cms in ./cms folder');
		serverConfig.cmsHealth = false;
		return false;
	}
}

/**
 * Fetch page data by key: if config.cmsHealth use CMS API, else load data/page/{key}.js
 * @param {string} key - Page key (e.g. 'index', 'ai-trend')
 * @returns {Promise<{ data: object, meta: object|null }|null>}
 */
export async function getPageData(key) {
	const safe = safeKey(key);
	if (!safe) {
		console.error('Invalid page key:', key);
		return null;
	}
	if (await useCms()) {
		try {
			const res = await fetch(
				`${serverConfig.cmsUrl}/api/pages/content/${encodeURIComponent(safe.toLowerCase())}`,
			);
			if (!res.ok) return null;
			const json = await res.json();
			const row = json?.data;
			if (!row) return null;
			if (row.type && row.type !== 'json') return { data: null, meta: null };
			let data = row.data;
			let meta = row.meta;
			if (typeof data === 'string') data = JSON.parse(data);
			if (typeof meta === 'string') meta = JSON.parse(meta);
			return { data, meta };
		} catch (err) {
			console.error('CMS fetch page failed:', safe, err);
			return null;
		}
	}
	try {
		const dataModule = await import(`../../data/page/${safe}.js`);
		return { data: dataModule.default, meta: dataModule.meta || null };
	} catch (err) {
		console.error('Failed to load local page data:', safe, err);
		return null;
	}
}

/**
 * Fetch comps with local fallback (e.g. header, footer).
 * - When CMS is healthy, fetches `/api/comp/public/keys/[k1,k2,...]` and returns requested keys.
 * - When CMS is unavailable or a key is missing, falls back to local data files.
 *
 * Local fallbacks:
 * - header → `data/comps/header.js`
 * - footer → `data/comps/footer.js`
 * - other keys → same behavior as getCompByKey (theme, etc.) when available
 *
 * @param {string[]} [keys=['header', 'footer']]
 * @returns {Promise<Record<string, unknown>>}
 */
export async function getComps(keys) {
	const requested = Array.isArray(keys) && keys.length ? keys : ['header', 'footer'];
	const result = {};

	const cmsOk = await useCms();
	let cmsData = null;

	if (cmsOk) {
		try {
			const listSegment = encodeURIComponent(`[${requested.join(',')}]`);
			const res = await fetch(
				`${serverConfig.cmsUrl}/api/comp/public/keys/${listSegment}`,
			);
			if (res.ok) {
				const json = await res.json();
				cmsData = json?.data || {};
			}
		} catch (err) {
			console.error('CMS fetch comps failed:', err);
		}
	}

	for (const key of requested) {
		const safe = safeKey(key);
		if (!safe) {
			result[key] = null;
			continue;
		}

		let value = null;

		if (cmsData && Object.prototype.hasOwnProperty.call(cmsData, safe)) {
			value = cmsData[safe] ?? null;
		}

		if (value == null) {
			try {
				if (safe === 'header') {
					const m = await import('../../data/comps/header.js');
					value = m.default ?? null;
				} else if (safe === 'footer') {
					const m = await import('../../data/comps/footer.js');
					value = m.default ?? null;
				} else if (safe === 'theme') {
					const m = await import('../../data/comps/theme.js');
					value = m.default ?? null;
				} else {
					const m = await import(`../../data/comps/${safe}.js`);
					value = m.default ?? null;
				}
			} catch (err) {
				console.error('Failed to load local comp:', key, err);
				value = null;
			}
		}

		result[key] = value;
	}

	return result;
}

/**
 * Fetch one comp by key (e.g. theme): if config.cmsHealth use CMS API, else load data/comps/theme.js or data/comps/{key}.js
 * @param {string} key - Comp key (e.g. 'theme', 'theme-pink')
 * @returns {Promise<object|null>}
 */
export async function getCompByKey(key) {
	const safe = safeKey(key);
	if (!safe) return null;
	if (await useCms()) {
		try {
			const res = await fetch(
				`${serverConfig.cmsUrl}/api/comp/public/${encodeURIComponent(key)}`,
			);
			if (!res.ok) return null;
			const json = await res.json();
			const row = json?.data;
			if (!row) return null;
			let data = row.data;
			if (typeof data === 'string') {
				try {
					data = JSON.parse(data);
				} catch {
					return null;
				}
			}
			return data != null ? data : null;
		} catch (err) {
			console.error('CMS fetch comp failed:', key, err);
			// Fall through to local fallback
		}
	}
	try {
		if (safe === 'theme') {
			const m = await import('../../data/comps/theme.js');
			return m.default ?? null;
		}
		const m = await import(`../../data/comps/${safe}.js`);
		return m.default ?? null;
	} catch (err) {
		console.error('Failed to load local comp:', key, err);
		return null;
	}
}

export { useCms };
