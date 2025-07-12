import { getGeoByPath } from './geo.js';
import { geoType } from './geo.js';
import { formatPrice, formatNumber, formatSqft } from '../client/js/core/format.js';

/**
 * Maps our geo path format to SOA API format
 * @param {string} ourPath - Our geo path format (e.g., "tx/round-rock")
 * @returns {string} - SOA API path format (e.g., "round-rock-tx/")
 */
export function mapGeoPathToSOAPath(ourPath) {
	if (!ourPath) {
		throw new Error('Path is required');
	}

	const geo = getGeoByPath(ourPath);
	if (!geo || !geo.type) {
		throw new Error('Invalid geo path');
	}

	switch (geo.type) {
		case geoType.state:
			return `${geo.state}/`;
		case geoType.city:
			return `${geo.city.toLowerCase().replace(/\s+/g, '-')}-${geo.state.toLowerCase()}/`;
		case geoType.county:
			return `${geo.county.toLowerCase().replace(/\s+/g, '-')}-county-${geo.state.toLowerCase()}/`;
		case geoType.zipcode:
			return `${geo.state.toLowerCase()}/${geo.zipcode}/`;
		case geoType.neighborhood:
			return `${geo.city
				.toLowerCase()
				.replace(/\s+/g, '-')}-${geo.state.toLowerCase()}/${geo.neighborhood
				.toLowerCase()
				.replace(/\s+/g, '-')}/`;
		default:
			throw new Error(`Unsupported geo type: ${geo.type}`);
	}
}

/**
 * Maps SOA API path format back to our geo path format
 * @param {string} soaPath - SOA API path format (e.g., "round-rock-tx/")
 * @param {string} stateCode - State code to use in our format (e.g., "tx")
 * @returns {string} - Our geo path format (e.g., "tx/round-rock")
 */
export function mapSOAToGeoPath(soaPath, stateCode = 'tx') {
	if (!soaPath) {
		throw new Error('Path is required');
	}

	// Remove trailing slash
	const cleanPath = soaPath.replace(/\/$/, '');
	const segments = cleanPath.split('/').filter((segment) => segment.trim());

	if (segments.length === 0) {
		throw new Error('Invalid path format');
	}

	if (segments.length === 1) {
		// State only: ca -> tx (or provided stateCode)
		return stateCode;
	}

	if (segments.length === 2) {
		const firstSegment = segments[0];
		const secondSegment = segments[1];

		// Check if it's a zipcode
		if (/^\d{5}$/.test(secondSegment)) {
			// ca/78664 -> tx/78664
			return `${stateCode}/${secondSegment}`;
		}

		// Check if it's a county
		if (firstSegment.endsWith('-county')) {
			// williamson-county-ca -> tx/williamson_county
			const countyName = firstSegment.replace('-county', '').replace(/-/g, '_');
			return `${stateCode}/${countyName}_county`;
		}

		// Check if it's a city (ends with state code)
		if (firstSegment.includes('-') && firstSegment.endsWith(`-${stateCode}`)) {
			// round-rock-tx -> tx/round-rock
			const cityName = firstSegment.replace(`-${stateCode}`, '').replace(/-/g, '_');
			return `${stateCode}/${cityName}`;
		}
	}

	if (segments.length === 3) {
		// round-rock-tx/old-town -> tx/round-rock/old-town_neighborhood
		const citySegment = segments[0];
		const neighborhood = segments[2];

		if (citySegment.includes('-') && citySegment.endsWith(`-${stateCode}`)) {
			const cityName = citySegment.replace(`-${stateCode}`, '').replace(/-/g, '_');
			const neighborhoodName = neighborhood.replace(/-/g, '_');
			return `${stateCode}/${cityName}/${neighborhoodName}_neighborhood`;
		}
	}

	throw new Error(`Unsupported SOA path format: ${soaPath}`);
}

export function mapPropertyToArticle(property) {
	// Determine tags based on status and conditions
	let tags = [];
	const status = property.houseRealStatus || 'ACTIVE';

	switch (status.toUpperCase()) {
		case 'ACTIVE':
			const openHouse = property.openHouses;
			const dom = property.daysOnMovoto;
			if (openHouse && openHouse.length > 0) {
				tags.push({ className: 'major active', text: 'Open House' });
			} else if ((dom && parseInt(dom) <= 7) || dom === 0) {
				tags.push({ className: 'major active', text: 'New' });
			} else {
				tags.push({ className: 'major active', text: 'For Sale' });
			}
			break;
		case 'PENDING':
			tags.push({
				value: 'Pending active',
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
	let article = {
		id: property.propertyId,
		img: property.tnImgPath,
		imgTag: property.mlsName || 'Provided by MLS',
		imgAlt: property.fullAddress,
		title: property.fullAddress,
		href: property.dppUrl,
		tags: tags,
		attrs: attrs,
	};
	return article;
}

export function mapPropertiesToArticles(properties) {
	return properties.map((property) => mapPropertyToArticle(property));
}
