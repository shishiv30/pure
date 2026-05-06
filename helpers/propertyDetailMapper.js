import { formatNumber, formatSqft } from '../client/js/core/format.js';
import { mapPropertyToArticle } from './propertyMapper.js';
import { getCityPath, getStatePath } from './geo.js';

/**
 * Unwrap typical SOA envelope { data: T }.
 * @param {unknown} raw
 * @returns {unknown}
 */
export function unwrapPropertyApiPayload(raw) {
	if (raw == null) {
		return null;
	}
	if (
		typeof raw === 'object' &&
		raw.data !== undefined &&
		raw.data !== null &&
		typeof raw.data === 'object'
	) {
		return raw.data;
	}
	return raw;
}

/**
 * Find listing-like object from primary-listing/v2 payload.
 * @param {unknown} plain
 * @returns {object|null}
 */
export function extractPrimaryListing(plain) {
	if (!plain || typeof plain !== 'object') {
		return null;
	}
	const o = /** @type {Record<string, unknown>} */ (plain);
	return /** @type {object|null} */ (
		o.listing ||
			o.primaryListing ||
			o.property ||
			(o.propertyId || o.id || o.listingId ? plain : null)
	);
}

/**
 * Collect photo URLs from common listing shapes.
 * @param {object} listing
 * @returns {string[]}
 */
export function collectPhotoUrls(listing) {
	if (!listing || typeof listing !== 'object') {
		return [];
	}
	const L = /** @type {Record<string, unknown>} */ (listing);
	const out = [];
	const pushUrl = (u) => {
		if (typeof u === 'string' && u.trim()) {
			out.push(u.trim());
		}
	};
	const fromArr = (arr) => {
		if (!Array.isArray(arr)) {
			return;
		}
		for (const item of arr) {
			if (typeof item === 'string') {
				pushUrl(item);
			} else if (item && typeof item === 'object') {
				const p = /** @type {Record<string, unknown>} */ (item);
				pushUrl(/** @type {string} */ (p.url || p.src || p.href || p.imageUrl));
			}
		}
	};
	fromArr(L.photos);
	fromArr(L.media);
	fromArr(L.images);
	fromArr(L.imageUrls);
	pushUrl(/** @type {string} */ (L.primaryPhotoUrl));
	pushUrl(/** @type {string} */ (L.tnImgPath));
	pushUrl(/** @type {string} */ (L.thumbnailUrl));
	const seen = new Set();
	return out.filter((u) => (seen.has(u) ? false : (seen.add(u), true)));
}

/**
 * Normalize API listing to the shape expected by mapPropertyToArticle.
 * @param {object|null} listing
 * @returns {object|null}
 */
export function normalizeListingToPropertyShape(listing) {
	if (!listing || typeof listing !== 'object') {
		return null;
	}
	const L = /** @type {Record<string, unknown>} */ (listing);
	const city = String(L.city || L.cityName || L.mailCity || '').trim();
	const stateRaw = L.state || L.stateCode || L.mailState || '';
	const state = String(stateRaw).toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
	const street = [L.street, L.streetAddress, L.addressLine1]
		.filter((x) => typeof x === 'string' && x.trim())
		.map((x) => String(x).trim())[0];
	const fullAddress =
		String(L.fullAddress || L.address || '').trim() ||
		[street, city, state].filter(Boolean).join(', ');
	const propertyId = String(L.propertyId || L.id || L.listingId || '').trim();
	if (!propertyId) {
		return null;
	}
	const bed = L.bedrooms ?? L.bed ?? L.bedroomCount;
	const bath = L.bathrooms ?? L.bath ?? L.bathroomCount;
	const listPrice = L.listPrice ?? L.price ?? L.listingPrice;
	const areaDisplay =
		L.areaDisplay ??
		L.livingAreaDisplay ??
		(L.livingAreaSqft != null ? formatSqft(Number(L.livingAreaSqft)) : undefined);
	return {
		propertyId,
		fullAddress: fullAddress || propertyId,
		bed,
		bath,
		listPrice,
		houseRealStatus: L.houseRealStatus || L.status || L.listingStatus,
		openHouses: L.openHouses,
		labelName: L.labelName,
		priceChange: L.priceChange,
		isSold: L.isSold,
		isActive: L.isActive,
		areaUnit: L.areaUnit || 'Sqft',
		areaDisplay,
		pricePerArea: L.pricePerArea,
		yearBuilt: L.yearBuilt,
		tnImgPath: L.tnImgPath || L.thumbnailUrl || L.primaryPhotoUrl,
		mlsName: L.mlsName || L.providerName,
		city,
		state,
		listingPathForPhotos: L.listingPath || L.pdpPath || L.path || L.url,
	};
}

/**
 * Public remarks / description text from listing.
 * @param {object|null} listing
 * @returns {string}
 */
export function extractListingDescription(listing) {
	if (!listing || typeof listing !== 'object') {
		return '';
	}
	const L = /** @type {Record<string, unknown>} */ (listing);
	const parts = [
		L.publicRemarks,
		L.remarks,
		L.listingDescription,
		L.description,
		L.remark,
	]
		.filter((x) => typeof x === 'string' && x.trim())
		.map((x) => String(x).trim());
	return parts[0] || '';
}

/**
 * Normalize histories API payload to an array.
 * @param {unknown} raw
 * @returns {object[]}
 */
export function normalizeHistoryList(raw) {
	const data = unwrapPropertyApiPayload(raw);
	if (Array.isArray(data)) {
		return data;
	}
	if (data && typeof data === 'object') {
		const d = /** @type {Record<string, unknown>} */ (data);
		const list = d.histories || d.list || d.items || d.records;
		if (Array.isArray(list)) {
			return list;
		}
	}
	return [];
}

/**
 * @param {object} h
 * @returns {{ date: string, title: string, subtitle: string }}
 */
export function mapHistoryRow(h) {
	if (!h || typeof h !== 'object') {
		return { date: '', title: '', subtitle: '' };
	}
	const o = /** @type {Record<string, unknown>} */ (h);
	const date = String(
		o.eventDate || o.transactionDate || o.date || o.closeDate || o.recordedDate || '',
	).trim();
	const title = String(o.eventType || o.type || o.status || o.event || 'Record').trim();
	let subtitle = '';
	if (o.price != null && o.price !== '') {
		subtitle = typeof o.price === 'number' ? `$${formatNumber(o.price)}` : String(o.price);
	} else if (typeof o.description === 'string') {
		subtitle = o.description.trim();
	} else if (typeof o.remarks === 'string') {
		subtitle = o.remarks.trim();
	}
	return { date, title, subtitle };
}

/**
 * @param {unknown} historiesRaw
 * @returns {Array<{ date: string, title: string, subtitle: string }>}
 */
export function mapHistoriesToDatelist(historiesRaw) {
	const rows = normalizeHistoryList(historiesRaw).map(mapHistoryRow);
	rows.sort((a, b) => String(b.date).localeCompare(String(a.date)));
	return rows;
}

/**
 * @param {{ city?: string, state?: string, fullAddress?: string, propertyId?: string }} prop
 * @param {string} [basePath]
 * @returns {{ links: Array<{ text: string, href: string }> }}
 */
export function buildDetailBreadcrumb(prop, basePath = '/demo') {
	const base = basePath.replace(/\/$/, '') || '/demo';
	const links = [{ text: 'Home', href: base }];
	if (prop.state) {
		links.push({ text: prop.state, href: `${base}/${getStatePath(prop.state)}` });
	}
	if (prop.city && prop.state) {
		links.push({ text: prop.city, href: `${base}/${getCityPath(prop.city, prop.state)}` });
	}
	links.push({ text: prop.fullAddress || prop.propertyId || 'Listing', href: '' });
	return { links };
}

/**
 * Build detail DTO for demo page / API (tags, photos comp, description, record, datelist).
 * @param {object|null} listingRaw — extractPrimaryListing output (mutable API shape)
 * @param {unknown} historiesRaw
 * @param {string[]} photoUrls
 * @param {string} propertyId
 * @returns {object|null}
 */
export function buildDetailDto(listingRaw, historiesRaw, photoUrls, propertyId) {
	const propShape = normalizeListingToPropertyShape(listingRaw);
	if (!propShape) {
		return null;
	}
	const article = mapPropertyToArticle(propShape);
	const images =
		Array.isArray(photoUrls) && photoUrls.length > 0
			? photoUrls
			: propShape.tnImgPath
				? [propShape.tnImgPath]
				: [];
	const datelist = mapHistoriesToDatelist(historiesRaw);
	return {
		propertyId: propShape.propertyId || propertyId,
		title: propShape.fullAddress || propertyId,
		tags: article.tags,
		photos: {
			initialIndex: 0,
			alt: article.imgAlt || '',
			images,
		},
		description: extractListingDescription(listingRaw),
		record: article.attrs,
		datelist,
	};
}
