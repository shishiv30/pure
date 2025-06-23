import { formatPrice, formatNumber, formatSqft } from '../client/js/core/format.js';

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
