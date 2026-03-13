import { fetchFromGeoarea } from '../configs/realestate.js';
import {
	mapSoaCitiesResponse,
	mapSoaNeighborhoodsResponse,
	mapSoaZipcodesResponse,
} from '../../helpers/soaGeoMapper.js';
import { createHeaderComponent } from '../ejs/comp_header.js';
import { createFooterComponent } from '../ejs/comp_footer.js';
import { createLinksComponent } from '../ejs/comp_links.js';
import { getStateFullName } from '../../helpers/stateDict.js';
import { getZipcodesForSitemap } from '../../helpers/geo.js';
import { getGeoData } from '../../data/index.js';

const SITEMAP_BASE = '/sitemap';

function geoToLink(geo, base, textOverride) {
	if (!geo || !geo.path) return null;
	const hrefBase = `${base}/${geo.path}`;
	const href = geo.id ? `${hrefBase}?id=${geo.id}` : hrefBase;
	const text = textOverride || geo.neighborhood || geo.zipcode || geo.path;
	return { text, href };
}

function citySlugToName(slug) {
	return (slug || '').replace(/-/g, ' ').trim();
}

function matchCityBySlug(cities, stateCode, citySlug) {
	const want = citySlugToName(citySlug).toLowerCase().replace(/\s+/g, '-');
	for (const c of cities) {
		if (c.state !== stateCode) continue;
		const nameSlug = (c.city || '').toLowerCase().replace(/\s+/g, '-');
		if (nameSlug === want) return c;
	}
	return null;
}

export default {
	name: 'sitemap-city',
	assetName: 'demo',
		beforeGet(req, payload) {
		const pathMatch = req.path.match(/^\/sitemap\/([a-z]{2})\/([^/]+)\/?$/i);
		if (pathMatch) {
			return {
				stateCode: pathMatch[1].toUpperCase(),
				citySlug: pathMatch[2],
					id: req.query?.id,
			};
		}
		return null;
	},
	seo(req, model) {
		const cityName = model?.data?.cityName || 'City';
		const stateName = model?.data?.stateName || 'State';
		return {
			title: `${cityName}, ${stateName} Neighborhoods & Zipcodes Sitemap`,
			desc: `Browse neighborhoods and zipcodes in ${cityName}, ${stateName}.`,
			keywords: `sitemap, neighborhoods, zipcodes, ${cityName}, ${stateName}`,
		};
	},
	get: async function (payload) {
		if (!payload?.stateCode || !payload?.citySlug) {
			throw new Error('State code and city slug are required');
		}
		const stateCode = payload.stateCode;
		const stateName = getStateFullName(stateCode) || stateCode;
		let cityId = payload.id;
		let cityName;
		if (!cityId) {
			const rawCities = await fetchFromGeoarea('GET', `/state/${stateCode}/cities`, {
				query: payload.query,
			});
			if (rawCities && rawCities.length === 0) {
				const cities = mapSoaCitiesResponse(rawCities);
				const city = matchCityBySlug(cities, stateCode, payload.citySlug);
				if (!city || !city.id) {
					throw new Error(`City not found: ${payload.citySlug}`);
				}
				cityId = city.id;
				cityName = city.city || citySlugToName(payload.citySlug);
			}
		}
		if(!cityName){
			cityName = citySlugToName(payload.citySlug);
		}

		let neighborhoodsComponent = null;
		let zipcodesComponent = null;
		if(!cityId){
				// Fallback to static geo data: only zipcode links
				const geoData = getGeoData();
				const zipcodesData = geoData?.zipcode || [];
				const zipcodeLinks = getZipcodesForSitemap(cityName, stateCode, SITEMAP_BASE, zipcodesData);
				if (zipcodeLinks.length > 0) {
					zipcodesComponent = createLinksComponent(zipcodeLinks);
				}
		} else {
			const [rawNeighborhoods, rawZipcodes] = await Promise.all([
				fetchFromGeoarea('GET', `/city/${cityId}/neighborhoods`, { query: payload.query }),
				fetchFromGeoarea('GET', `/city/${cityId}/postalcodes`, { query: payload.query }),
			]);

			if (rawZipcodes && rawZipcodes.length > 0) {
				const zipcodes = mapSoaZipcodesResponse(rawZipcodes) || [];
				const zipcodeLinks = zipcodes.map((g) => geoToLink(g, SITEMAP_BASE)).filter(Boolean);
				if (zipcodeLinks.length > 0) {
					zipcodesComponent = createLinksComponent(zipcodeLinks);
				}
			}
			
			if (rawNeighborhoods && rawNeighborhoods.length > 0) {
				const neighborhoods = mapSoaNeighborhoodsResponse(rawNeighborhoods) || [];
				const neighborhoodLinks = neighborhoods.map((g) => geoToLink(g, SITEMAP_BASE)).filter(Boolean);
				if (neighborhoodLinks.length > 0) {
					neighborhoodsComponent = createLinksComponent(neighborhoodLinks);
				}
			}
		}
		const headerComponent = createHeaderComponent();
		const footerComponent = createFooterComponent();
		const breadcrumb = {
			links: [
				{ text: 'Home', href: '/' },
				{ text: 'Sitemap', href: SITEMAP_BASE },
				{ text: stateName, href: `${SITEMAP_BASE}/${stateCode.toLowerCase()}` },
				{ text: cityName, href: '' },
			],
		};
		return {
			title: `${cityName} Neighborhoods & Zipcodes`,
			cityName,
			stateName,
			stateCode,
			breadcrumb,
			headerComponent,
			footerComponent,
			neighborhoodsComponent,
			zipcodesComponent,
		};
	},
};
