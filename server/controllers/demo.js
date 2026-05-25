import {
	getGeoDisplayText,
	geoType,
	getGeoByPath,
} from '../../helpers/geo.js';
import { getGeoCityByIp } from '../../helpers/ip.js';
import {
	buildDetailSeo,
	mapPropertyDetailToArticle,
	mapSOADataListToArticles,
} from '../../helpers/article.js';
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
		const prId = req.query.prId;

		const geoPathRaw = req.query.geoPath;
		if (geoPathRaw) {
			geo = getGeoByPath(geoPathRaw);
		} else if ((req.query.ip || req.ip) && !prId) {
			const ip = req.query.ip || req.ip;
			geo = getGeoCityByIp(ip);
		}

		return {
			...payload,
			geo,
			prId,
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
		const { geo, prId } = payload || {};
		const welcomeImage = getImgCdnUrl(config.cdnHost, '/welcome.webp');

		let [nearbyRaw, listingRaw, historiesRaw] = await Promise.all([
			geo ? searchHouse(geo) : Promise.resolve(null),
			prId ? getPropertyListingInfoById(prId) : Promise.resolve(null),
			prId ? getPropertyHistoryById(prId) : Promise.resolve(null),
		]);

		const detail = mapPropertyDetailToArticle(listingRaw, historiesRaw);

		let articles = [];
		let articleTotalCount = 0;
		if (nearbyRaw && nearbyRaw.listings && nearbyRaw.listings.length > 0) {
			articles = mapSOADataListToArticles(nearbyRaw.listings);
			articleTotalCount = nearbyRaw.articleTotalCount;
		}

		const articleComponent = createArticleComponent(articles);
		const headerComponent = createHeaderComponent();
		const footerComponent = createFooterComponent();
		const seo = buildDetailSeo(detail) || getSeo(geo);

		return {
			seo,
			geo,
			articleComponent,
			articleTotalCount,
			headerComponent,
			footerComponent,
			welcomeImage,
			cdnHost: config.cdnHost,
			appHost: config.appHost,
			soaApiDomain: config.soaApiDomain,
			detail,
		};
	},
};
