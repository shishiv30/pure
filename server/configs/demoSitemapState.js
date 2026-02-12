import { getCountiesForSitemap, getGeoByPath, getBreadcrumbByGeo } from '../../helpers/geo.js';
import { getGeoData } from '../../data/index.js';
import { createHeaderComponent } from '../ejs/comp_header.js';
import { createFooterComponent } from '../ejs/comp_footer.js';
import { createLinksComponent } from '../ejs/comp_links.js';
import { getStateFullName } from '../../helpers/stateDict.js';

const SITEMAP_BASE = '/demo/sitemap';

export default {
	name: 'demo-sitemap-state',
	assetName: 'demo',
	beforeGet: function (req, payload) {
		// Extract state code from path (e.g., /demo/sitemap/ca -> ca)
		const pathMatch = req.path.match(/^\/demo\/sitemap\/([a-z]{2})$/i);
		if (pathMatch) {
			return { stateCode: pathMatch[1].toUpperCase() };
		}
		return null;
	},
	seo: function (req, model) {
		const stateName = model?.data?.stateName || 'State';
		return {
			title: `${stateName} Counties Sitemap`,
			desc: `Browse all counties in ${stateName}.`,
			keywords: `sitemap, counties, ${stateName}`,
		};
	},
	get: async function (payload) {
		if (!payload?.stateCode) {
			throw new Error('State code is required');
		}

		const geoData = getGeoData();
		if (!geoData || !geoData.county) {
			throw new Error('Geo data not available');
		}

		const stateCode = payload.stateCode;
		const stateName = getStateFullName(stateCode) || stateCode;
		const countyLinks = getCountiesForSitemap(stateCode, SITEMAP_BASE, geoData.county);
		const linksComponent = createLinksComponent(countyLinks);
		const headerComponent = createHeaderComponent();
		const footerComponent = createFooterComponent();

		// Build breadcrumb: Home > Sitemap > State
		const geo = { state: stateCode, type: 'state' };
		const breadcrumb = getBreadcrumbByGeo(geo, SITEMAP_BASE);
		if (breadcrumb && breadcrumb.links) {
			// Replace first link to point to /demo/sitemap
			breadcrumb.links[0] = { text: 'Home', href: '/demo' };
			breadcrumb.links.splice(1, 0, { text: 'Sitemap', href: '/demo/sitemap' });
			// Last item is current (no href)
			const lastLink = breadcrumb.links[breadcrumb.links.length - 1];
			if (lastLink) {
				lastLink.href = '';
			}
		}

		return {
			title: `${stateName} Counties`,
			stateName,
			stateCode,
			breadcrumb,
			headerComponent,
			footerComponent,
			linksComponent,
		};
	},
};
