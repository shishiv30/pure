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
		const type = row.type || '';
		const parsed =
			type === 'json' && typeof raw === 'string'
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
		if (!row || row.type !== 'json' || row.data == null) return null;
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
 * Dynamic page config: fetches content from CMS by key.
 * Route: GET /page/:key (e.g. /page/index, /page/about).
 * For key "index", fetches page "pageIndex" from CMS pages table and returns { sections }.
 * Header and footer are loaded from local data files (data/page/header.js, data/page/footer.js).
 */
export default {
	name: 'page',
	assetName: 'index',
	seo(req) {
		const key = req.params?.key || 'page';
		return {
			title: `Pure - ${key}`,
			desc: '',
			keywords: '',
		};
	},
	beforeGet(req) {
		return { key: req.params?.key };
	},
	get: async function (payload) {
		if (!payload.key) return null;
		const base = cmsUrl();

		const fallback = () => ({
			headerComponent: createHeaderComponent(),
			footerComponent: createFooterComponent(),
			pageContent: null,
			sections: null,
		});

		// Use local data files for header and footer
		const headerComponent = createHeaderComponent();
		const footerComponent = createFooterComponent();

		if (!base) return fallback();

		const pageCmsName = `${payload.key}`.toLowerCase();
		const pageIndexData = await fetchPageByName(pageCmsName);

		if (pageIndexData) {
			const raw = arrayToPageData(pageIndexData);
			const cdnUrl = (serverConfig.cdnUrl || '').replace(/\/$/, '');
			const appUrl = (serverConfig.appUrl || '').replace(/\/$/, '');
			const resolved = resolvePageData(raw, { cdnUrl, appUrl });
			const sections = buildSections(resolved, SECTION_CREATORS);
			return {
				headerComponent,
				footerComponent,
				sections,
			};
		} else {
			console.error('CMS fetch page failed:', pageCmsName);
			// Return fallback when CMS fetch fails
			return fallback();
		}
	},
};
