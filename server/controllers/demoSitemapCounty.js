import { getCitiesForSitemap, getGeoByPath, getBreadcrumbByGeo } from '../../helpers/geo.js';
import { getGeoData } from '../../data/index.js';
import { createHeaderComponent } from '../ejs/comp_header.js';
import { createFooterComponent } from '../ejs/comp_footer.js';
import { createLinksComponent } from '../ejs/comp_links.js';

const SITEMAP_BASE = '/demo/sitemap';

export default {
	name: 'demo-sitemap-county',
	assetName: 'demo',
	beforeGet: function (req, payload) {
		// Extract state and county from path (e.g., /demo/sitemap/ca/los-angeles_county)
		const pathMatch = req.path.match(/^\/demo\/sitemap\/([a-z]{2})\/([^\/]+)_county$/i);
		if (pathMatch) {
			const stateCode = pathMatch[1].toUpperCase();
			const countyCode = pathMatch[2].replace(/-/g, ' ');
			return { stateCode, countyCode };
		}
		return null;
	},
	seo: function (req, model) {
		const countyName = model?.data?.countyName || 'County';
		const stateName = model?.data?.stateName || 'State';
		return {
			title: `${countyName}, ${stateName} Cities Sitemap`,
			desc: `Browse all cities in ${countyName}, ${stateName}.`,
			keywords: `sitemap, cities, ${countyName}, ${stateName}`,
		};
	},
	get: async function (payload) {
		if (!payload?.stateCode || !payload?.countyCode) {
			throw new Error('State code and county code are required');
		}

		const geoData = getGeoData();
		if (!geoData || !geoData.county || !geoData.city) {
			throw new Error('Geo data not available');
		}

		const stateCode = payload.stateCode;
		const countyCode = payload.countyCode.replace(/-/g, ' '); // Convert hyphens back to spaces

		// Find the county to get its full name
		// Match by countyCode (short name) or by converting county name
		const county = geoData.county.find(
			(c) =>
				c.state === stateCode &&
				(c.countyCode?.toLowerCase().trim() === countyCode.toLowerCase().trim() ||
					c.county?.replace(/\s+County$/i, '').toLowerCase().trim() === countyCode.toLowerCase().trim()),
		);
		const countyName = county?.county || `${countyCode} County`;

		// Get state name
		const geo = getGeoByPath(`${stateCode.toLowerCase()}`);
		const stateName = geo?.state || stateCode;

		const cityLinks = getCitiesForSitemap(countyName, stateCode, SITEMAP_BASE, geoData.city);
		const linksComponent = createLinksComponent(cityLinks);
		const headerComponent = createHeaderComponent();
		const footerComponent = createFooterComponent();

		// Build breadcrumb: Home > Sitemap > State > County
		const countyGeo = { state: stateCode, county: countyName, type: 'county' };
		const breadcrumb = getBreadcrumbByGeo(countyGeo, SITEMAP_BASE);
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
			title: `${countyName} Cities`,
			countyName,
			stateName,
			stateCode,
			breadcrumb,
			headerComponent,
			footerComponent,
			linksComponent,
		};
	},
};
