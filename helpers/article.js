import { formatPrice, formatNumber } from '../client/js/core/format.js';
import { getGeoDisplayText } from './geo.js';
import {
	mapHistoryRowsToTimelineComp,
	mapOpenHousesToComp,
	mapSOADataToMetadata,
	normalizeGroupedFeatures,
} from './property.js';

/**
 * @param {unknown} groupedFeatures
 * @returns {Array<{ key: string, value: string, desc: string }>}
 */
export function mapGroupedFeaturesToAttrs(groupedFeatures) {
	const groups = normalizeGroupedFeatures(groupedFeatures);
	if (!groups) {
		return [];
	}
	const attrs = [];
	for (const name of Object.keys(groups)) {
		const items = groups[name];
		if (!Array.isArray(items) || !items.length) {
			continue;
		}
		const value = items
			.filter((item) => item != null && String(item).trim())
			.map((item) => String(item).trim())
			.join(', ');
		if (!value) {
			continue;
		}
		const key = name.charAt(0).toUpperCase() + name.slice(1);
		attrs.push({ key, value, desc: key });
	}
	return attrs;
}

/**
 * @param {unknown} soaListings
 * @returns {object[]}
 */
export function mapSOADataListToArticles(soaListings) {
	if (!Array.isArray(soaListings)) {
		return [];
	}
	return soaListings
		.map(mapSOADataToMetadata)
		.filter(Boolean)
		.map((meta) => mapPropertyToArticle(meta));
}

export function mapPropertyToAttrs(property, allAttrs = false) {
	let attrs = [];
	if (property.price) {
		attrs.push({
			key: 'Est',
			value: `$${formatNumber(property.price)}`,
			desc: 'Estimate Price',
		});
	}
	if (property.bed) {
		attrs.push({
			key: 'Bd',
			value: property.bed,
			desc: 'Bedrooms',
		});
	}
	if (property.bath) {
		attrs.push({
			key: 'Ba',
			value: property.bath,
			desc: 'Bathrooms',
		});
	}
	if (property.areaDisplay) {
		attrs.push({
			key: property.areaUnit,
			value: property.areaDisplay,
			desc: 'Lot Size',
		});
	}
	if (property.pricePerArea) {
		attrs.push({
			key: `/${property.areaUnit}`,
			value: `${formatNumber(Math.round(property.pricePerArea))}`,
			desc: 'Price Per Sqft',
		});
	}

	if (property.yearBuilt) {
		attrs.push({
			key: 'Yr',
			value: property.yearBuilt,
			desc: 'Year Built',
		});
	}

	if (allAttrs) {
		attrs.push({
			key: 'Agent',
			value: property.agentListFullName,
			desc: 'Agent',
		});

		attrs.push({
			key: 'Office',
			value: property.officeListName,
			desc: 'Office',
		});

		attrs.push({
			key: 'Phone',
			value: property.officeListPhone,
			desc: 'Phone',
		});

		attrs.push(...mapGroupedFeaturesToAttrs(property.groupedFeatures));
	}
	return attrs;
}

/**
 * Map normalized property metadata to the article card shape used by `comp_article`.
 *
 * @param {object} property — metadata from `mapSOADataToMetadata`
 * @returns {object}
 */
export function mapPropertyToArticle(property, isFull = false) {
	const listingStatus = property.listingStatus;
	const status =
		listingStatus &&
		typeof listingStatus === 'object' &&
		/** @type {Record<string, unknown>} */ (listingStatus).name != null
			? String(/** @type {Record<string, unknown>} */ (listingStatus).name)
			: '';
	const daysOnMarket = property.daysOnMarket;
	const officeListName = property.officeListName;

	const statusUpper = status.toUpperCase();
	const tags = [];
	const openHouses = property.openHouses;
	const hasOpenHouse = Array.isArray(openHouses) && openHouses.length > 0;
	const dom = daysOnMarket != null ? parseInt(String(daysOnMarket), 10) : NaN;
	const isNew = dom === 0 || (Number.isFinite(dom) && dom <= 7);

	// Order: Open House > Sold/status > price change > New
	if (hasOpenHouse) {
		tags.push({ className: 'major active', text: 'Open' });
	}
	switch (statusUpper) {
		case 'SOLD':
			tags.push({ className: 'active', text: 'Sold' });
			break;
		case 'PENDING':
			tags.push({ text: 'Pending', className: 'tip' });
			break;
		case 'OFF_MARKET':
			tags.push({ className: 'minor', text: 'Off Market' });
			break;
		case 'REMOVED':
			tags.push({ className: 'minor', text: 'Removed' });
			break;
	}
	if (property.priceChange > 0) {
		tags.push({
			className: 'safe',
			icon: 'arrow-circle-up',
			text: formatPrice(property.priceChange),
		});
	} else if (property.priceChange < 0) {
		tags.push({
			className: 'danger',
			icon: 'arrow-circle-down',
			text: formatPrice(Math.abs(property.priceChange)),
		});
	}
	if (isNew) {
		tags.push({ className: 'safe active', text: 'New' });
	}

	let attrs = mapPropertyToAttrs(property, isFull);

	const geo = property.geo;
	const displayAddress = getGeoDisplayText(geo);

	return {
		metadata: property,
		img: Array.isArray(property.photos) ? property.photos[0] : undefined,
		imgTag: officeListName,
		imgAlt: displayAddress,
		title: displayAddress,
		path: `/property/detail/${geo?.state?.toLowerCase()}/${geo.zipcode}/${property.prId}`,
		tags,
		attrs,
	};
}

/**
 * @param {object[]} tags
 * @returns {{ items: object[] }|null}
 */
export function mapTagsToComp(tags) {
	if (!Array.isArray(tags) || !tags.length) {
		return null;
	}
	return { items: tags };
}

/**
 * @param {unknown} photos — preview URL strings from metadata
 * @param {string} [alt]
 * @returns {{ images: string[], initialIndex: number, alt: string }|null}
 */
export function mapAlbumToComp(photos, alt = '') {
	const images = Array.isArray(photos) ? photos : [];
	if (!images.length) {
		return null;
	}
	return {
		images,
		initialIndex: 0,
		alt,
	};
}

/**
 * @param {unknown} description
 * @returns {{ text: string }|null}
 */
export function mapParagraphToComp(description) {
	if (description == null || description === '') {
		return null;
	}
	return { text: String(description) };
}

/**
 * @param {object[]} attrs
 * @param {string} [heading]
 * @returns {{ heading: string, items: object[] }|null}
 */
export function mapRecordToComp(attrs, heading = 'Facts') {
	if (!Array.isArray(attrs) || !attrs.length) {
		return null;
	}
	return { heading, items: attrs };
}

/**
 * Map SOA listing (+ optional histories) to comp render models for `comp_article_detail`.
 *
 * @see docs/listing-data-pipeline.md (map: listing-pipeline)
 * @param {object|null|undefined} soaListing — raw SOA listing
 * @param {unknown} [historiesRaw]
 * @returns {object|null}
 */
export function mapPropertyDetailToArticle(soaListing, historiesRaw = null) {
	const metadata = mapSOADataToMetadata(soaListing, historiesRaw);
	if (!metadata || !metadata.listingUrl) {
		return null;
	}
	const card = mapPropertyToArticle(metadata, true);
	const tags = Array.isArray(card.tags) ? card.tags.slice() : [];
	const geo = metadata.geo;
	if (geo?.city) {
		tags.push({ text: String(geo.city), className: 'default' });
	}
	if (geo?.zipcode) {
		tags.push({ text: String(geo.zipcode), className: 'default' });
	}

	return {
		metadata,
		title: card.title,
		tags: mapTagsToComp(tags),
		album: mapAlbumToComp(metadata.photos, card.title || ''),
		paragraph: mapParagraphToComp(metadata.description),
		record: mapRecordToComp(card.attrs),
		openHouses: mapOpenHousesToComp(metadata.openHouses),
		timeline: mapHistoryRowsToTimelineComp(metadata.histories),
	};
}

/**
 * SEO fields for a demo detail page from metadata + comp models (no raw SOA listing).
 *
 * @param {object} detail — result of `mapPropertyDetailToArticle`
 * @returns {{ title: string, description: string, desc: string, keywords: string }|null}
 */
export function buildDetailSeo(detail) {
	if (!detail || !detail.metadata) {
		return null;
	}
	const { metadata } = detail;
	const listingStatus = metadata.listingStatus;
	const statusLabel =
		listingStatus &&
		typeof listingStatus === 'object' &&
		/** @type {Record<string, unknown>} */ (listingStatus).displayName != null
			? String(/** @type {Record<string, unknown>} */ (listingStatus).displayName)
			: '';
	const title = detail.title || '';
	const description = detail.paragraph?.text || '';
	return {
		title: `${title}${statusLabel ? ` | ${statusLabel}` : ''} - demo`,
		description,
		desc: description,
		keywords: `${title}${statusLabel ? `, ${statusLabel}` : ''}, demo`,
	};
}

/**
 * @param {object[]} properties
 * @returns {object[]}
 */
export function mapPropertiesToArticles(properties) {
	return properties.map((property) => mapPropertyToArticle(property));
}
