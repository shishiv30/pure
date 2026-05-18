import {
	getGeoDisplayText,
	geoType,
	getGeoByPath,
} from '../../helpers/geo.js';
import articlesData from '../../data/mock/articles.js';
import { getGeoCityByIp } from '../../helpers/ip.js';
import {
	collectPhotoUrls,
	extractPrimaryListing,
	mapSOADataListToArticles,
	mapSOADataToArticleDetail,
	mapSOADataToMetadata,
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
import { getImgCdnUrl } from '../../helpers/url.js';

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
			if (!normalized.startsWith('detail/')) {
				geo = getGeoByPath(normalized);
			}
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
	preload: function (_req, model) {
		const href = model?.data?.welcomeImage;
		if (!href) {
			return null;
		}
		return [{ as: 'image', href }];
	},
	get: async function (payload) {
		const { geo: geoIn, propertyId } = payload || {};
		let geo = geoIn;
		const welcomeImage = getImgCdnUrl(config.cdnHost, '/welcome.webp');

		let listingRaw = null;
		let historiesRaw = null;
		if (propertyId) {
			[listingRaw, historiesRaw] = await Promise.all([
				getPropertyListingInfoById(propertyId),
				getPropertyHistoryById(propertyId),
			]);
		}

		const listing = propertyId
			? extractPrimaryListing(unwrapPropertyApiPayload(listingRaw))
			: null;
		if (listing && !geo) {
			const meta = mapSOADataToMetadata(listing);
			if (meta?.geo) {
				geo = meta.geo;
			}
		}

		const properties = await searchHouse(geo);

		let articles = [];
		if (properties) {
			articles =
				Array.isArray(properties.listings) && properties.listings.length > 0
					? mapSOADataListToArticles(properties.listings)
					: articlesData;
		}

		let detail = null;
		let detailError = null;
		if (propertyId) {
			if (!listing) {
				detailError = 'Listing unavailable';
			} else {
				const photoUrls = collectPhotoUrls(listing);
				detail = mapSOADataToArticleDetail(
					listing,
					historiesRaw,
					photoUrls,
					propertyId,
				);
				if (!detail) {
					detailError = 'Listing unavailable';
				}
			}
		}

		const nearbyArticles = propertyId
			? articles.filter((article) => !String(article.path || '').endsWith(`/${propertyId}`))
			: [];

		const articleComponent = createArticleComponent(articles);
		const headerComponent = createHeaderComponent();
		const footerComponent = createFooterComponent();
		const seo = detail
			? {
					title: detail.title || 'Listing',
					description: detail.description || '',
					desc: detail.description || '',
					keywords: getSeo(geo).keywords,
				}
			: getSeo(geo);

		return {
			seo,
			geo,
			articles,
			articleComponent,
			nearbyArticleComponent: createArticleComponent(nearbyArticles),
			headerComponent,
			footerComponent,
			welcomeImage,
			cdnHost: config.cdnHost,
			appHost: config.appHost,
			soaApiDomain: config.soaApiDomain,
			detail,
			detailError,
		};
	},
};
