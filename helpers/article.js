import { formatPrice, formatNumber, formatSqft } from '../client/js/core/format.js';
import { getGeoDisplayText } from './geo.js';
import { mapSOADataToMetadata } from './property.js';

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

/**
 * Map a Movoto-style property record to the article card shape used by `comp_article`.
 *
 * @param {object} property
 * @returns {object}
 */
export function mapPropertyToArticle(property) {
	const listingStatus = property.listingStatus;
	const status =
		listingStatus &&
		typeof listingStatus === 'object' &&
		/** @type {Record<string, unknown>} */ (listingStatus).name != null
			? String(/** @type {Record<string, unknown>} */ (listingStatus).name)
			: '';
	const sqftTotal = property.sqftTotal;
	const areaUnit = 'Sqft';
	const areaDisplay =
		sqftTotal != null && sqftTotal !== ''
			? formatSqft(Number(sqftTotal))
			: undefined;
	let pricePerArea;
	if (property.price != null && sqftTotal != null && sqftTotal !== '') {
		const sq = Number(sqftTotal);
		if (sq > 0) {
			pricePerArea = Number(property.price) / sq;
		}
	}
	const daysOnMarket = property.daysOnMarket;
	const officeListName = property.officeListName;

	// Determine tags based on status and conditions
	let tags = [];

	switch (status.toUpperCase()) {
		case 'ACTIVE': {
			const openHouse = property.openHouses;
			const dom = daysOnMarket;
			if (openHouse && openHouse.length > 0) {
				tags.push({ className: 'major active', text: 'Open House' });
			} else if ((dom && parseInt(dom, 10) <= 7) || dom === 0) {
				tags.push({ className: 'major active', text: 'New' });
			} else {
				tags.push({ className: 'major active', text: 'For Sale' });
			}
			break;
		}
		case 'PENDING':
			tags.push({
				text: 'Pending',
				className: 'tip',
			});
			break;
		case 'SOLD':
			tags.push({ className: 'minor', text: 'Sold' });
			break;

		case 'OFF_MARKET':
			tags.push({ className: 'minor', text: 'Off Market' });
			break;

		case 'REMOVED':
			tags.push({ className: 'minor', text: 'Removed' });
			break;
	}

	// Add price change information if available
	if (property.priceChange && status.toUpperCase() === 'ACTIVE') {
		if (property.priceChange > 0) {
			tags.push({ key: 'safe', value: `Increased ${formatPrice(property.priceChange)}` });
		} else if (property.priceChange < 0) {
			tags.push({ key: 'danger', value: `Reduced ${formatPrice(Math.abs(property.priceChange))}` });
		}
	}

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
	if (areaDisplay) {
		attrs.push({
			key: areaUnit,
			value: areaDisplay,
			desc: 'Lot Size',
		});
	}
	if (pricePerArea) {
		attrs.push({
			key: `/${areaUnit}`,
			value: `${formatNumber(Math.round(pricePerArea))}`,
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

	const geo = property.geo;
	const displayAddress = getGeoDisplayText(geo);

	let article = {
		metadata: property,
		img: Array.isArray(property.photos) ? property.photos[0] : undefined,
		imgTag: officeListName,
		imgAlt: displayAddress,
		title: displayAddress,
		path: `/demo/detail/${geo?.state?.toLowerCase()}/${geo.zipcode}/${property.prId}`,
		tags: tags,
		attrs: attrs,
	};
	return article;
}

/**
 * @param {object[]} properties
 * @returns {object[]}
 */
export function mapPropertiesToArticles(properties) {
	return properties.map((property) => mapPropertyToArticle(property));
}
