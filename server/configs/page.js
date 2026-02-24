import serverConfig from '../config.js';
import { resolvePageData, buildSections, arrayToPageData } from '../../helpers/pageData.js';
import { createHeaderComponent } from '../ejs/comp_header.js';
import { createFooterComponent } from '../ejs/comp_footer.js';
import { createHeroComponent } from '../ejs/comp_hero.js';
import { createGalleryComponent } from '../ejs/comp_gallery.js';
import { createPointsComponent } from '../ejs/comp_points.js';
import { createScrollviewComponent } from '../ejs/comp_scrollview.js';
import { createTimelineComponent } from '../ejs/comp_timeline.js';

const cmsUrl = () => (serverConfig.cmsUrl || '').replace(/\/$/, '');

const SECTION_CREATORS = {
	hero: createHeroComponent,
	scrollview: createScrollviewComponent,
	points: createPointsComponent,
	gallery: createGalleryComponent,
	timeline: createTimelineComponent,
};


async function fetchCompByKey(key) {
	const base = cmsUrl();
	if (!base) return null;
	try {
		const res = await fetch(`${base}/api/comp/public/${encodeURIComponent(key)}`);
		if (!res.ok) return null;
		const json = await res.json();
		const row = json?.data;
		if (!row) return null;
		const raw = row.data;
		const parsed =
			typeof raw === 'string'
				? (() => {
					try {
						return JSON.parse(raw);
					} catch {
						return raw;
					}
				})()
				: raw;
		return parsed;
	} catch (err) {
		console.error('CMS fetch comp failed:', key, err);
		return null;
	}
}

/**
 * Fetch published page content by name from CMS pages table.
 * @param {string} name - Page name (e.g. 'pageIndex')
 * @returns {Promise<object|null>} Parsed page data or null
 */
async function fetchPageByName(name) {
	const base = cmsUrl();
	if (!base || !name) return null;
	try {
		const res = await fetch(`${base}/api/pages/content/${encodeURIComponent(name)}`);
		if (!res.ok) return null;
		const json = await res.json();
		const row = json?.data;
		if (!row || row.data == null) return null;
		const fmt = row.format ?? row.type;
		if (fmt && fmt !== 'json') return null;
		const raw = row.data;
		const parsed =
			typeof raw === 'string'
				? (() => {
					try {
						return JSON.parse(raw);
					} catch {
						return null;
					}
				})()
				: raw;
		return parsed && typeof parsed === 'object' ? parsed : null;
	} catch (err) {
		console.error('CMS fetch page failed:', name, err);
		return null;
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
	const base = cmsUrl();
	const pageCmsName = `${key}`.toLowerCase();

	// Try CMS first
	if (base) {
		try {
			const pageData = await fetchPageByName(pageCmsName);
			if (pageData && typeof pageData === 'object') {
				return pageData;
			}
		} catch (err) {
			console.error('CMS fetch page failed:', pageCmsName, err);
		}
	}

	// Fallback to local data file
	try {
		const dataModule = await import(`../../data/page/${key}.js`);
		return dataModule.default || null;
	} catch (err) {
		console.error('Failed to load local page data:', key, err);
		return null;
	}
}

async function loadPageMetadata(key) {
	try {
		const dataModule = await import(`../../data/page/${key}.js`);
		return {
			name: dataModule.name || key,
			path: dataModule.path || `page/${key}`,
			seo: dataModule.seo || {
				title: `Pure - ${key.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}`,
				desc: '',
				keywords: '',
			},
		};
	} catch (err) {
		// Fallback metadata if file doesn't exist
		const title = key.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
		return {
			name: key,
			path: `page/${key}`,
			seo: {
				title: `Pure - ${title}`,
				desc: '',
				keywords: '',
			},
		};
	}
}

// Shared page handler logic
async function handlePageGet(key) {
	const fallback = () => ({
		headerComponent: createHeaderComponent(),
		footerComponent: createFooterComponent(),
		pageContent: null,
		sections: null,
	});

	// Use local data files for header and footer
	const headerComponent = createHeaderComponent();
	const footerComponent = createFooterComponent();

	const pageData = await loadPageData(key);
	if (!pageData) {
		console.error('Failed to load page data for:', key);
		return fallback();
	}

	const raw = arrayToPageData(pageData);
	const cdnUrl = (serverConfig.cdnUrl || '').replace(/\/$/, '');
	const appUrl = (serverConfig.appUrl || '').replace(/\/$/, '');
	const resolved = resolvePageData(raw, { cdnUrl, appUrl });
	const sections = buildSections(resolved, SECTION_CREATORS);

	return {
		headerComponent,
		footerComponent,
		sections,
	};
}

// Index page config (home route /)
export const indexConfig = {
	name: 'index',
	assetName: 'index',
	async seo() {
		const metadata = await loadPageMetadata('index');
		return metadata.seo;
	},
	get: async function () {
		return handlePageGet('index');
	},
};

// Dynamic page config (route /page/:key)
export default {
	name: 'page',
	assetName: 'index',
	async seo(req) {
		const key = req.params?.key || 'page';
		const metadata = await loadPageMetadata(key);
		return metadata.seo;
	},
	beforeGet(req) {
		return { key: req.params?.key };
	},
	get: async function (payload) {
		if (!payload.key) return null;
		return handlePageGet(payload.key);
	},
};
