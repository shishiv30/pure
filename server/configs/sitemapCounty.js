import { fetchFromGeoarea } from '../configs/realestate.js';
import { mapSoaCountiesResponse, mapSoaCitiesResponse } from '../../helpers/soaGeoMapper.js';
import { createHeaderComponent } from '../ejs/comp_header.js';
import { createFooterComponent } from '../ejs/comp_footer.js';
import { createLinksComponent } from '../ejs/comp_links.js';
import { getStateFullName } from '../../helpers/stateDict.js';

const SITEMAP_BASE = '/sitemap';

function geoToLink(geo, base) {
	if (!geo || !geo.path) return null;
	return { text: geo.city || geo.path, href: `${base}/${geo.path}` };
}

function countySlugToName(slug) {
	return (slug || '')
		.replace(/_county$/i, '')
		.replace(/-/g, ' ')
		.trim();
}

function matchCountyBySlug(counties, stateCode, countySlug) {
	const want = countySlugToName(countySlug).toLowerCase();
	for (const c of counties) {
		if (c.state !== stateCode) continue;
		const name = (c.county || '').replace(/\s+county$/i, '').trim().toLowerCase();
		const nameSlug = name.replace(/\s+/g, '-');
		if (name === want || nameSlug === want) return c;
	}
	return null;
}

export default {
	name: 'sitemap-county',
	assetName: 'demo',
	beforeGet(req, payload) {
		const pathMatch = req.path.match(/^\/sitemap\/([a-z]{2})\/([^/]+)_county\/?$/i);
		if (pathMatch) {
			return {
				stateCode: pathMatch[1].toUpperCase(),
				countySlug: pathMatch[2],
			};
		}
		return null;
	},
	seo(req, model) {
		const countyName = model?.data?.countyName || 'County';
		const stateName = model?.data?.stateName || 'State';
		return {
			title: `${countyName}, ${stateName} Cities Sitemap`,
			desc: `Browse all cities in ${countyName}, ${stateName}.`,
			keywords: `sitemap, cities, ${countyName}, ${stateName}`,
		};
	},
	get: async function (payload) {
		if (!payload?.stateCode || !payload?.countySlug) {
			throw new Error('State code and county slug are required');
		}
		const stateCode = payload.stateCode;
		const stateName = getStateFullName(stateCode) || stateCode;
		const rawCounties = await fetchFromGeoarea('GET', `/state/${stateCode}/counties`, {
			query: payload.query,
		});
		const counties = mapSoaCountiesResponse(rawCounties);
		const county = matchCountyBySlug(counties, stateCode, payload.countySlug);
		if (!county || !county.id) {
			throw new Error(`County not found: ${payload.countySlug}`);
		}
		const countyName = county.county || countySlugToName(payload.countySlug);
		const rawCities = await fetchFromGeoarea('GET', `/county/${county.id}/cities`, {
			query: payload.query,
		});
		const cities = mapSoaCitiesResponse(rawCities);
		const cityLinks = cities.map((g) => geoToLink(g, SITEMAP_BASE)).filter(Boolean);
		const linksComponent = createLinksComponent(cityLinks);
		const headerComponent = createHeaderComponent();
		const footerComponent = createFooterComponent();
		const breadcrumb = {
			links: [
				{ text: 'Home', href: '/' },
				{ text: 'Sitemap', href: SITEMAP_BASE },
				{ text: stateName, href: `${SITEMAP_BASE}/${stateCode.toLowerCase()}` },
				{ text: countyName, href: '' },
			],
		};
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
