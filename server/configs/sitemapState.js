import { fetchFromGeoarea } from '../configs/realestate.js';
import { mapSoaCountiesResponse } from '../../helpers/soaGeoMapper.js';
import { createHeaderComponent } from '../ejs/comp_header.js';
import { createFooterComponent } from '../ejs/comp_footer.js';
import { createLinksComponent } from '../ejs/comp_links.js';
import { getStateFullName } from '../../helpers/stateDict.js';
import { getCountiesForSitemap } from '../../helpers/geo.js';
import { getGeoData } from '../../data/index.js';

const SITEMAP_BASE = '/sitemap';

function geoToLink(geo, base) {
	if (!geo || !geo.path) return null;
	return { text: geo.county || geo.path, href: `${base}/${geo.path}` };
}

export default {
	name: 'sitemap-state',
	assetName: 'demo',
	beforeGet(req, payload) {
		const pathMatch = req.path.match(/^\/sitemap\/([a-z]{2})\/?$/i);
		if (pathMatch) {
			return { stateCode: pathMatch[1].toUpperCase() };
		}
		return null;
	},
	seo(req, model) {
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
		const stateCode = payload.stateCode;
		const stateName = getStateFullName(stateCode) || stateCode;
		const raw = await fetchFromGeoarea('GET', `/state/${stateCode}/counties`, {
			query: payload.query,
		});
		let linksComponent;
		if (!raw || (Array.isArray(raw) && raw.length === 0)) {
			const geoData = getGeoData();
			const countiesData = geoData?.county || [];
			const countyLinks = getCountiesForSitemap(stateCode, SITEMAP_BASE, countiesData);
			linksComponent = createLinksComponent(countyLinks);
		} else {
			const counties = mapSoaCountiesResponse(raw) || [];
			const countyLinks = counties.map((g) => geoToLink(g, SITEMAP_BASE)).filter(Boolean);
			linksComponent = createLinksComponent(countyLinks);
		}
		const headerComponent = createHeaderComponent();
		const footerComponent = createFooterComponent();
		const breadcrumb = {
			links: [
				{ text: 'Home', href: '/' },
				{ text: 'Sitemap', href: SITEMAP_BASE },
				{ text: stateName, href: '' },
			],
		};
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
