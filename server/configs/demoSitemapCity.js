import { getZipcodesForSitemap, getGeoByPath, getBreadcrumbByGeo } from '../../helpers/geo.js';
import { getGeoData } from '../../data/index.js';
import { createHeaderComponent } from '../ejs/comp_header.js';
import { createFooterComponent } from '../ejs/comp_footer.js';
import { createLinksComponent } from '../ejs/comp_links.js';

const SITEMAP_BASE = '/demo/sitemap';

export default {
	name: 'demo-sitemap-city',
	assetName: 'demo',
	beforeGet: function (req, payload) {
		// Extract state and city from path (e.g., /demo/sitemap/ca/los-angeles)
		const pathMatch = req.path.match(/^\/demo\/sitemap\/([a-z]{2})\/([^\/]+)$/i);
		if (pathMatch) {
			const stateCode = pathMatch[1].toUpperCase();
			const cityCode = pathMatch[2].replace(/-/g, ' ');
			return { stateCode, cityCode };
		}
		return null;
	},
	seo: function (req, model) {
		const cityName = model?.data?.cityName || 'City';
		const stateName = model?.data?.stateName || 'State';
		return {
			title: `${cityName}, ${stateName} Zipcodes Sitemap`,
			desc: `Browse all zipcodes in ${cityName}, ${stateName}.`,
			keywords: `sitemap, zipcodes, ${cityName}, ${stateName}`,
		};
	},
	get: async function (payload) {
		if (!payload?.stateCode || !payload?.cityCode) {
			throw new Error('State code and city code are required');
		}

		const geoData = getGeoData();
		if (!geoData || !geoData.zipcode || !geoData.city) {
			throw new Error('Geo data not available');
		}

		const stateCode = payload.stateCode;
		const cityCode = payload.cityCode;

		// Find the city to get its full name
		const city = geoData.city.find(
			(c) => c.state === stateCode && c.city?.toLowerCase().replace(/\s+/g, '-') === cityCode.toLowerCase().replace(/\s+/g, '-'),
		);
		const cityName = city?.city || cityCode;

		// Get state name
		const geo = getGeoByPath(`${stateCode.toLowerCase()}`);
		const stateName = geo?.state || stateCode;

		const zipcodeLinks = getZipcodesForSitemap(cityName, stateCode, '/demo', geoData.zipcode);
		const linksComponent = createLinksComponent(zipcodeLinks);
		const headerComponent = createHeaderComponent();
		const footerComponent = createFooterComponent();

		// Build breadcrumb: Home > Sitemap > State > City
		const cityGeo = { state: stateCode, city: cityName, type: 'city' };
		const breadcrumb = getBreadcrumbByGeo(cityGeo, SITEMAP_BASE);
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
			title: `${cityName} Zipcodes`,
			cityName,
			stateName,
			stateCode,
			breadcrumb,
			headerComponent,
			footerComponent,
			linksComponent,
		};
	},
};
