import { formatPrice, formatNumber, formatSqft } from '../client/js/core/format.js';

export function mapPropertyToArticle(property) {
	// Determine tags based on status and conditions
	let tags = [];
	const status = property.houseRealStatus || 'ACTIVE';

	switch (status.toUpperCase()) {
		case 'ACTIVE':
			const openHouse = property.openHouses;
			if (openHouse && openHouse.length > 0) {
				tags.push({ className: 'major active', text: 'Open House' });
			} else if (property.labelName) {
				tags.push({ className: 'major active', text: property.labelName || 'For Sale' });
			}
			break;
		case 'PENDING':
			if (property.labelName) {
				tags.push({ className: 'tip', text: property.labelName || 'Pending' });
			}
			break;
		case 'SOLD':
			tags.push({ className: 'minor', text: property.labelName || 'Sold' });
			break;

		case 'OFF_MARKET':
			tags.push({ className: 'minor', text: property.labelName || 'Off Market' });
			break;

		case 'REMOVED':
			tags.push({ className: 'minor', text: property.labelName || 'Expired' });
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
			className: 'f4 text-bold',
			key: !property.isSold && !property.isActive ? 'Est' : '',
			value: `$${formatNumber(property.listPrice)}`,
			desc: !property.isSold && !property.isActive ? 'Estimate Price' : '',
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
			key: `$${formatNumber(Math.round(property.pricePerArea))}/${property.areaUnit}`,
			desc: 'Price Per Sqft',
		});
	}

	if (property.yearBuilt) {
		attrs.push({
			key: `${property.yearBuilt} Yr`,
			value: '',
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
