import { formatNumber, formatSqft } from '../client/js/core/format.js';
import { getCityPath, getStatePath, mapAddressToGeo } from './geo.js';
import { stringToDate } from './datetime.js';
/** SOA photo URL suffixes → preview `_p.webp` (case-insensitive). */
const SOA_PHOTO_WEBP_SUFFIX = /(?:_r|_l|_p)?\.webp$/i;

/**
 * Unwrap SOA API envelope `{ data }` or return the payload as-is.
 * @param {unknown} raw
 * @returns {unknown}
 */
function unwrapPropertyApiPayload(raw) {
	if (raw == null || typeof raw !== 'object') {
		return raw;
	}
	const o = /** @type {Record<string, unknown>} */ (raw);
	if ('data' in o) {
		return o.data;
	}
	return raw;
}


/**
 * Normalize SOA webp photo URL to preview size (`_p.webp`).
 * @param {string} url
 * @returns {string}
 */
export function toSoaPreviewPhotoUrl(url) {
	return String(url).replace(SOA_PHOTO_WEBP_SUFFIX, '_p.webp');
}

/**
 * SOA Pure `photos` array → preview URL strings (`_p.webp`).
 * @param {unknown} photos
 * @returns {string[]}
 */
export function mapSoaPhotosToUrls(photos) {
	if (!Array.isArray(photos)) {
		return [];
	}
	const out = [];
	for (const item of photos) {
		if (typeof item === 'string' && item.trim()) {
			out.push(toSoaPreviewPhotoUrl(item.trim()));
		} else if (item && typeof item === 'object') {
			const url = /** @type {Record<string, unknown>} */ (item).url;
			if (typeof url === 'string' && url.trim()) {
				out.push(toSoaPreviewPhotoUrl(url.trim()));
			}
		}
	}
	return out;
}

/**
 * @param {unknown} groupedFeatures — object or JSON string from SOA
 * @returns {Record<string, string[]>|null}
 */
export function normalizeGroupedFeatures(groupedFeatures) {
	if (groupedFeatures == null) {
		return null;
	}
	let raw = groupedFeatures;
	if (typeof groupedFeatures === 'string') {
		try {
			raw = JSON.parse(groupedFeatures);
		} catch {
			return null;
		}
	}
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
		return null;
	}
	return /** @type {Record<string, string[]>} */ (raw);
}

/**
 * @param {Record<string, unknown>} listing
 * @returns {unknown}
 */
function resolveSoaListingPrice(listing) {
	if(listing.listingStatus.name === 'SOLD') {
		return listing.soldPrice || listing.closePrice;
	} else if (listing.listingStatus.name !== 'ACTIVE' && listing.listingStatus.name !== 'PENDING') {
		return listing.closePrice || listing.soldPrice || listing.listPrice;
	}
	return listing.listPrice;
}

/**
 * Map SOA Pure listing (+ optional histories) to normalized metadata for article mappers.
 * List cards use listing only; detail pages pass `historiesRaw` for a sorted `histories` array.
 *
 * @see docs/listing-data-pipeline.md (map: listing-pipeline)
 * @param {object|null|undefined} soaListing
 * @param {unknown} [historiesRaw]
 * @returns {object|null}
 */
export function mapSOADataToMetadata(soaListing, historiesRaw = null) {
	if (!soaListing || typeof soaListing !== 'object') {
		return null;
	}
	const L = /** @type {Record<string, unknown>} */ (soaListing);
	const propertyId = String(L.id || '').trim();
	if (!propertyId) {
		return null;
	}
	const address =
		L.address && typeof L.address === 'object'
			? /** @type {Record<string, unknown>} */ (L.address)
			: null;

	const sqftTotal = L.sqftTotal;
	const lotSizeSqft = L.lotSizeSqft;
	const price = resolveSoaListingPrice(L);
	const area = Number(sqftTotal || lotSizeSqft);
	const areaUnit = 'Sqft';
	const areaDisplay = area > 0 ? formatSqft(Number(area)) : '';
	const pricePerArea = area > 0 && price > 0 ? price / area : null;

	const meta = {
		propertyId,
		geo: mapAddressToGeo(address),
		bed: L.bedrooms,
		bath: L.bathroomsTotal,
		attributes: L.attributesTags,
		price,
		listingStatus: L.listingStatus,
		openHouses: L.currentOpenHouses,
		priceChange: L.priceChangeAmount,
		grage: L.parkingGarageSpace,
		prId: L?.mlsPublicRecordAssociation?.id,
		mlsNumber: L.mlsNumber,
		mlsId: L?.mls?.id,
		mlsName: L?.mls?.name,
		sqftTotal,
		lotSizeSqft,
		area,
		areaUnit,
		areaDisplay,
		pricePerArea,
		yearBuilt: L.yearBuilt,
		photos: L?.photos?.length > 0 ? mapSoaPhotosToUrls(L.photos) : null,
		photoCount: L?.photoCount ?? 0,
		closeDate: L.closeDate ? stringToDate(L.closeDate) : null,
		soldDate: L.soldDate ? stringToDate(L.soldDate) : null,
		createDate: L.createdAt ? stringToDate(L.createdAt) : null,
		listDate: L.listDate ? stringToDate(L.listDate) : null,
		officeListName: L.officeListName,
		daysOnMarket: L.daysOnMarket,
		listingUrl: L.listingUrl,
		description: L.publicRemarks,
		agentLicenses: L.agentLicenses,
		agentListFullName: L.agentListFullName,
		officeListPhone: L.officeListPhone,
		groupedFeatures: normalizeGroupedFeatures(L.groupedFeatures),
	};

	if (historiesRaw != null) {
		meta.histories = mapHistoriesToDatelist(historiesRaw);
	}

	return meta;
}

/**
 * Collect photo URLs from a SOA Pure listing (`photos` only).
 * @param {object} listing
 * @returns {string[]}
 */
export function collectPhotoUrls(listing) {
	if (!listing || typeof listing !== 'object') {
		return [];
	}
	return mapSoaPhotosToUrls(/** @type {Record<string, unknown>} */ (listing).photos);
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
 * Map sorted history rows to `comp_timeline` data shape.
 * @param {Array<{ date: string, title: string, subtitle: string }>} rows
 * @returns {{ heading: string, intro: string, entries: object[] }|null}
 */
export function mapHistoryRowsToTimelineComp(rows) {
	if (!Array.isArray(rows) || !rows.length) {
		return null;
	}
	return {
		heading: 'History',
		intro: '',
		entries: rows.map((row) => ({
			type: 'desc',
			date: row.date,
			text: row.subtitle ? `${row.title} — ${row.subtitle}` : row.title,
		})),
	};
}

/**
 * Map SOA `currentOpenHouses` rows to `comp_open_houses` shape.
 * @param {unknown} openHouses
 * @returns {{ heading: string, items: object[] }|null}
 */
export function mapOpenHousesToComp(openHouses) {
	if (!Array.isArray(openHouses) || !openHouses.length) {
		return null;
	}
	const items = openHouses.filter((row) => row && typeof row === 'object');
	if (!items.length) {
		return null;
	}
	return {
		heading: 'Open Houses',
		items,
	};
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

