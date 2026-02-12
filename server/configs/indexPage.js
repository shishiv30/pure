import serverConfig from '../config.js';
import { resolvePageData, buildSections, arrayToPageData } from '../../helpers/pageData.js';
import { createHeaderComponent } from '../ejs/comp_header.js';
import { createFooterComponent } from '../ejs/comp_footer.js';
import { createHeroComponent } from '../ejs/comp_hero.js';
import { createGalleryComponent } from '../ejs/comp_gallery.js';
import { createPointsComponent } from '../ejs/comp_points.js';
import { createScrollviewComponent } from '../ejs/comp_scrollview.js';
import { createTimelineComponent } from '../ejs/comp_timeline.js';

const CMS_INDEX_PAGE_NAME = 'index';
const cmsUrl = () => (serverConfig.cmsUrl || '').replace(/\/$/, '');

const SECTION_CREATORS = {
	hero: createHeroComponent,
	scrollview: createScrollviewComponent,
	points: createPointsComponent,
	gallery: createGalleryComponent,
	timeline: createTimelineComponent,
};

/**
 * Load index page section data from CMS (page name "index") or fallback to data/pageindex.js.
 */
async function loadPageIndexData() {
	const base = cmsUrl();
	if (base) {
		try {
			const res = await fetch(`${base}/api/pages/content/${CMS_INDEX_PAGE_NAME}`);
			if (res.ok) {
				const json = await res.json();
				const row = json?.data;
				if (row && row.type === 'json' && row.data != null) {
					const parsed =
						typeof row.data === 'string'
							? (() => {
								try {
									return JSON.parse(row.data);
								} catch {
									return null;
								}
							})()
							: row.data;
					if (parsed && typeof parsed === 'object') return parsed;
				}
			}
		} catch (err) {
			console.error('CMS fetch index page failed:', err);
		}
	}
	const mod = await import('../../data/pageindex.js');
	return mod.default;
}

export default {
	name: 'index',
	seo: function () {
		return {
			title: 'Pure Home',
			desc: 'Author: Conjee Zou, UI solution, Category: Home',
			keywords: '',
		};
	},
	get: async function () {
		const headerComponent = createHeaderComponent();
		const footerComponent = createFooterComponent();

		const loaded = await loadPageIndexData();
		const raw = arrayToPageData(loaded);
		const cdnUrl = (serverConfig.cdnUrl || '').replace(/\/$/, '');
		const appUrl = (serverConfig.appUrl || '').replace(/\/$/, '');
		const resolved = resolvePageData(raw, { cdnUrl, appUrl });
		const sections = buildSections(resolved, SECTION_CREATORS);

		return {
			headerComponent,
			footerComponent,
			sections,
		};
	},
};
