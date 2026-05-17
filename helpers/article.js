import { formatPrice, formatNumber } from '../client/js/core/format.js';

/**
 * Single-line street label from listing `address` (SOA / nested shape).
 * Uses addressInfo, city, state, zipCode (falls back to zipcode).
 *
 * @param {Record<string, unknown>|null|undefined} addr
 * @returns {string}
 */
export function formatAddressLineFromAddress(addr) {
	if (!addr || typeof addr !== 'object') {
		return '';
	}
	const street = String(
		addr.addressInfo ?? addr.street ?? addr.addressLine1 ?? addr.streetAddress ?? '',
	).trim();
	const city = String(addr.city ?? '').trim();
	const county = String(addr.county ?? '').trim();
	const state = String(addr.state ?? addr.stateCode ?? '').trim();
	const zip = String(addr.zipCode ?? addr.zipcode ?? '').trim();
	const stateZip = [state, zip].filter(Boolean).join(' ').trim();
	const localityInner = [city, county, stateZip].filter(Boolean).join(', ');
	if (street && localityInner) {
		return `${street}, ${localityInner}`;
	}
	if (street) {
		return street;
	}
	if (localityInner) {
		return localityInner;
	}
	return '';
}

/**
 * Map a Movoto-style property record to the article card shape used by `comp_article`.
 *
 * @param {object} property
 * @returns {object}
 */
export function mapPropertyToArticle(property) {
	// Determine tags based on status and conditions
	let tags = [];
	const status = property.houseRealStatus || 'ACTIVE';

	switch (status.toUpperCase()) {
		case 'ACTIVE': {
			const openHouse = property.openHouses;
			const dom = property.daysOnMovoto;
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
	if (property.listPrice) {
		attrs.push({
			key: 'Est',
			value: `$${formatNumber(property.listPrice)}`,
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
	if (property.areaUnit) {
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
	
	const displayAddress =
		formatAddressLineFromAddress(property.address) ||
		String(property.fullAddress || '').trim() ||
		'';

	let article = {
		id: property.propertyId,
		img: property.tnImgPath,
		imgTag: property.mlsName || 'Provided by MLS',
		imgAlt: displayAddress,
		title: displayAddress,
		href: property.listingUrl,
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
