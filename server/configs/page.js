import serverConfig from '../config.js';
import { createHeaderComponent } from '../ejs/comp_header.js';
import { createFooterComponent } from '../ejs/comp_footer.js';

/**
 * Fetch all type='comp' comps from CMS in one request. Returns { header, footer, ... } keyed by comp key.
 * @returns {Promise<{ header: object|array|null, footer: object|array|null }>}
 */
async function fetchPageComps() {
	try {
		const res = await fetch(`${serverConfig.cmsUrl}/api/comp/public`);
		if (!res.ok) return { header: null, footer: null };
		const json = await res.json();
		const data = json?.data || {};
		return {
			header: data.header ?? null,
			footer: data.footer ?? null,
		};
	} catch (err) {
		console.error('CMS fetch comps failed:', err);
		return { header: null, footer: null };
	}
}

/** Fetch one comp by key (e.g. theme). Returns parsed data or null. */
async function fetchCompByKey(key) {
	try {
		const res = await fetch(`${serverConfig.cmsUrl}/api/comp/public/${encodeURIComponent(key)}`);
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
		return null;
	}
}



/**
 * Fetch published page by name from CMS. Returns both content (data) and SEO (meta).
 * @param {string} name - Page name (e.g. 'ai-trend')
 * @returns {Promise<{ data: object, meta: object|null }|null>} data for sections, meta for seo (title, desc, keywords)
 */
async function fetchPageByName(name) {
	try {
		const res = await fetch(`${serverConfig.cmsUrl}/api/pages/content/${encodeURIComponent(name)}`);
		if (!res.ok) return null;
		const json = await res.json();
		const row = json?.data;
		if (!row) return null;
		if(row.type && row.type !== 'json') return { data:null, meta:null };
		try{
			let data = row.data;
			let meta = row.meta;
			if(typeof data === 'string') data = JSON.parse(data);
			if(typeof meta === 'string') meta = JSON.parse(meta);
			return { data, meta };
		} catch (err) {
			console.error('Failed to parse page data or meta:', name, err);
			return { data: null, meta: null };
		}
	} catch (err) {
		console.error('CMS fetch page failed:', name, err);
		return { data: null, meta: null };
	}
}
/**
 * Dynamic page config: fetches content from CMS by key or loads from local data files.
 * Route: GET /page/:key (e.g. /page/index, /page/ai-trend).
 * Loads page metadata (name, path, seo) and section data from data/page/[key].js files.
 * Falls back to CMS if available, otherwise uses local data files.
 * Header and footer are loaded from local data files.
 */
async function loadPageData(key) {
	const pageCmsName = `${key}`.toLowerCase();
	const result = await fetchPageByName(pageCmsName);
	if (result?.data) {
		return result;
	}
	try {
		const dataModule = await import(`../../data/page/${key}.js`);
		return { data: dataModule.default, meta: dataModule.meta || null };
	} catch (err) {
		console.error('Failed to load local page data:', key, err);
		return null;
	}
}

// Shared page handler logic
async function handlePageGet(key) {
	const fallback = () => ({
		headerComponent: createHeaderComponent(),
		footerComponent: createFooterComponent(),
		theme: null,
		pageContent: null,
		sections: null,
	});

	const comps = await fetchPageComps();
	const { header: headerData, footer: footerData } = comps;

	const headerComponent = createHeaderComponent(headerData ?? undefined);
	const footerComponent = createFooterComponent(footerData ?? undefined);

	const pageResult = await loadPageData(key);
	if (!pageResult?.data) {
		console.error('Failed to load page data for:', key);
		return fallback();
	}

	try {
		const sections = pageResult.data;
		const meta = pageResult.meta ?? undefined;
		const themeKey = typeof meta?.theme === 'string' ? meta.theme.trim() : '';
		const theme = themeKey ? await fetchCompByKey(themeKey) : undefined;
		return {
			headerComponent,
			footerComponent,
			sections,
			meta,
			...(theme != null && { theme }),
		};
	} catch (err) {
		console.error('Failed to build page sections for:', key, err);
		return fallback();
	}
}

function seoFromModel(req, model) {
	const m = model?.data?.meta;
	return { title: m?.title ?? '', desc: m?.desc ?? '', keywords: m?.keywords ?? '' };
}

// Index (route /) – same logic as page, fixed key
export const indexConfig = {
	name: 'index',
	assetName: 'index',
	async seo(req, model) {
		return seoFromModel(req, model);
	},
	get: async () => handlePageGet('index'),
};

// Dynamic page config (route /page/:key)
export default {
	name: 'page',
	assetName: 'index',
	async seo(req, model) {
		return seoFromModel(req, model);
	},
	beforeGet(req) {
		return { key: req.params?.key||'index' };
	},
	get: async (payload) => {
		if (!payload.key) return null;
		return handlePageGet(payload.key);
	},
};
