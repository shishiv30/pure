import {
	getGeoDisplayText,
	getGeoTitleText,
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
import { getFilterByQuery, getListingSortOptions } from '../../helpers/filter.js';
import { createFilterComponent } from '../ejs/comp_filter.js';
import { createPaginationComponent } from '../ejs/comp_pagination.js';

const STATUS_LABEL = { INACTIVE: 'Sold homes', FOR_RENT: 'Homes for rent', RENTAL: 'Homes for rent' };

function getSeo(geo, total, filter) {
	const place = geo ? getGeoTitleText(geo) : '';
	const what = STATUS_LABEL[filter?.searchPropertyStatus] || 'Homes for sale';
	const title = place ? `${what} in ${place} | ${config.appName || 'Pure'}` : `${what} | ${config.appName || 'Pure'}`;
	const count = total ? `${Number(total).toLocaleString('en-US')} ` : '';
	const desc = place
		? `${count}${what.toLowerCase()} in ${place}, from MLS listings: price, beds, baths, size, price per sqft, photos and history. Filter by price, beds, type and school zone.`
		: 'Homes for sale, sold homes and rentals from MLS listings.';
	return {
		title,
		description: desc,
		desc,
		keywords: `${place}, homes for sale, real estate, listings`,
	};
}

export default {
	name: 'property',
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

		const q = req.originalUrl.indexOf('?');
		return {
			...payload,
			geo,
			prId,
			filter: getFilterByQuery(req.query),
			// Search list pages only; a detail page's nearby list doesn't page
			listPage: prId ? null : { path: req.path.replace(/\/+$/, ''), search: q >= 0 ? req.originalUrl.slice(q) : '' },
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
		const { geo, prId, filter, listPage } = payload || {};
		const welcomeImage = getImgCdnUrl(config.cdnHost, '/welcome.webp');

		let [nearbyRaw, listingRaw, historiesRaw] = await Promise.all([
			geo ? searchHouse(geo, filter) : Promise.resolve(null),
			prId ? getPropertyListingInfoById(prId) : Promise.resolve(null),
			prId ? getPropertyHistoryById(prId) : Promise.resolve(null),
		]);

		const detail = mapPropertyDetailToArticle(listingRaw, historiesRaw);

		let articles = [];
		let articleTotalCount = 0;
		if (nearbyRaw && nearbyRaw.listings && nearbyRaw.listings.length > 0) {
			articles = mapSOADataListToArticles(nearbyRaw.listings);
			articleTotalCount = nearbyRaw.articleTotalCount ?? nearbyRaw.totalCount ?? 0;
		}

		const articleComponent = createArticleComponent(articles);
		const filterComponent = createFilterComponent(filter);
		const geoLabel = geo ? getGeoDisplayText(geo).trim() : '';
		const sortOptions = getListingSortOptions(filter, {
			path: listPage?.path || '',
			search: listPage?.search || '',
		});
		const paginationComponent = listPage
			? createPaginationComponent({
					total: articleTotalCount,
					path: listPage.path,
					search: listPage.search,
					index: filter?.pageIndex,
					size: filter?.maxCountPerPage,
				})
			: null;
		const headerComponent = createHeaderComponent();
		const footerComponent = createFooterComponent();
		const seo = buildDetailSeo(detail) || getSeo(geo, articleTotalCount, filter);

		return {
			seo,
			geo,
			geoLabel,
			sortOptions,
			articleComponent,
			filterComponent,
			paginationComponent,
			articleTotalCount,
			headerComponent,
			footerComponent,
			welcomeImage,
			cdnHost: config.cdnHost,
			appHost: config.appHost,
			detail,
			valueSort: nearbyRaw?.valueSort || null,
		};
	},
};
