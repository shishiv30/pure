import {
	getGeoDisplayText,
	geoType,
	getGeoByPath,
} from '../../helpers/geo.js';
import articlesData from '../../data/mock/articles.js';
import { getGeoCityByIp } from '../../helpers/ip.js';
import { mapSOADataListToArticles } from '../../helpers/property.js';
import {
	buildDetailBreadcrumb,
	buildDetailDto,
	collectPhotoUrls,
	extractPrimaryListing,
	normalizeListingToPropertyShape,
	unwrapPropertyApiPayload,
} from '../../helpers/property.js';
import config from '../config.js';
import {
	getPropertyHistoryById,
	getPropertyListingInfoById,
	searchHouse,
} from '../routes/api.soa.property.js';
import { createArticleComponent } from '../ejs/comp_article.js';
import { createHeaderComponent } from '../ejs/comp_header.js';
import { createFooterComponent } from '../ejs/comp_footer.js';

export async function fetchPropertiesImagesFromSOA(url) {
	try {
		if (!url) {
			throw new Error('Url is required');
		}
		const response = await fetch(
			`${config.soaApiDomain}/api/v/property/photo/?url=${encodeURIComponent(url)}`,
		);
		if (!response.ok) {
			throw new Error(`SOA API request failed: ${response.status} ${response.statusText}`);
		}
		const result = await response.json();
		let images = [];
		if (result.data && result.data.length > 0) {
			images = result.data.reduce((acc, curr) => {
				if (curr.photos && curr.photos.length > 0) {
					let urls = curr.photos.map((e) => {
						let url = e.url;
						if (/.webp$/.test(url)) {
							url = url.replace(/(_[a-z])?.webp$/, '_p.webp');
						}
						return url;
					});
					acc = acc.concat(urls);
				}
				return acc;
			}, []);
		} else {
			throw new Error('No images found, result:', result);
		}
		return images;
	} catch (error) {
		console.error('Error fetching property images:', error);
		return [];
	}
}

function getSeo(geo) {
	const label = geo ? getGeoDisplayText(geo).trim() : '';
	const place = label || 'Demo';
	const typePart = geo && geo.type ? `${geo.type} ` : '';
	const desc = `Search results at ${place} ${typePart}page`.trim();
	return {
		title: `Search results at ${place}`.trim(),
		description: desc,
		desc,
		keywords: `${place}, real estate, demo`,
	};
}

export default {
	name: 'demo',
	seo: function (_req, model) {
		const fromGet = model?.data?.seo;
		if (fromGet && typeof fromGet === 'object') {
			return {
				title: fromGet.title || 'Demo',
				desc: fromGet.desc || fromGet.description || '',
				keywords: fromGet.keywords || '',
			};
		}
		return {
			title: 'Demo',
			desc: '',
			keywords: 'demo',
		};
	},
	beforeGet: function (req, payload) {
		let geo;
		const geoPathRaw = req.query.geoPath || req.query.path;
		if (geoPathRaw) {
			const normalized = String(geoPathRaw).replace(/^\//, '').replace(/\/$/, '');
			geo = getGeoByPath(normalized);
		} else if (req.query.ip || req.ip) {
			const ip = req.query.ip || req.ip;
			geo = getGeoCityByIp(ip);
		}
		const propertyId = req.query.propertyId;

		return {
			...payload,
			geo,
			propertyId,
		};
	},
	preload: function (req, model) {
		let preload = null;
		if (model?.data?.articles?.length > 0) {
			preload = [
				{
					as: 'image',
					href: model.data.articles[0].img,
				},
			];
		}
		return preload;
	},
	get: async function (payload) {
		const { geo, propertyId } = payload || {};

		const [properties, listingRaw, historiesRaw] = await Promise.all([
			searchHouse(geo),
			...(propertyId ? [getPropertyListingInfoById(propertyId)] : []),
			...(propertyId ? [getPropertyHistoryById(propertyId)] : []),
		]);

		let articles = [];
		if (properties) {
			articles =
				Array.isArray(properties.listings) && properties.listings.length > 0
					? mapSOADataListToArticles(properties.listings)
					: articlesData;
		}

		const articleComponent = createArticleComponent(articles);
		const headerComponent = createHeaderComponent();
		const footerComponent = createFooterComponent();
		const seo = getSeo(geo);

		return {
			seo,
			geo,
			articles,
			articleComponent,
			nearbyArticleComponent: createArticleComponent([]),
			headerComponent,
			footerComponent,
			cdnHost: config.cdnHost,
			appHost: config.appHost,
			soaApiDomain: config.soaApiDomain,
			detail: null,
		};
	},
};
