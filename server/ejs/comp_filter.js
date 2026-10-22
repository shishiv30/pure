import { FILTER_PROPERTY_TYPES, FILTER_PROPERTY_STATUSES } from '../../helpers/filter.js';

const COMPONENT_NAME = 'filter';
const COMPONENT_TEMPLATE = 'comp_filter';

const BED_STOPS = ['no_min', 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 'no_max'];
const PRICE_STOPS = [
	'no_min',
	0,
	100000,
	250000,
	500000,
	750000,
	1000000,
	1500000,
	2000000,
	3000000,
	4000000,
	5000000,
	7500000,
	10000000,
	'no_max',
];

function labelFromValue(value) {
	return value
		.split('_')
		.map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
		.join(' ');
}

function stopIndex(stops, value, emptyIndex) {
	if (value === undefined || value === null || value === '') {
		return emptyIndex;
	}
	const exact = stops.findIndex((stop) => stop === value || stop === Number(value));
	if (exact >= 0) {
		return exact;
	}
	let nearest = emptyIndex;
	let distance = Infinity;
	stops.forEach((stop, index) => {
		if (typeof stop !== 'number') {
			return;
		}
		const gap = Math.abs(stop - Number(value));
		if (gap < distance) {
			distance = gap;
			nearest = index;
		}
	});
	return nearest;
}

function rangeField(id, label, stops, minValue, maxValue, format) {
	const minIndex = stopIndex(stops, minValue, 0);
	const maxIndex = Math.max(minIndex, stopIndex(stops, maxValue, stops.length - 1));
	return {
		id,
		type: 'range',
		label,
		format,
		stops: stops.join(','),
		minIndex,
		maxIndex,
		scaleMin: 'no min',
		scaleMax: 'no max',
	};
}

/**
 * @param {Record<string, unknown>} [filter] SOA nearby-search fields
 */
export function createFilterComponent(filter = {}) {
	const source = filter && typeof filter === 'object' ? filter : {};
	const selectedTypes = new Set(
		Array.isArray(source.propertyTypes)
			? source.propertyTypes.map((value) => String(value).toLowerCase())
			: [],
	);
	const status =
		source.searchPropertyStatus === 'INACTIVE'
			? 'sold'
			: source.searchPropertyStatus === 'FOR_RENT' ||
				  source.searchPropertyStatus === 'RENTAL'
				? 'rental'
				: '';
	const offMarket = status === 'sold' || status === 'rental';

	const data = {
		fields: [
			rangeField('price', 'Price', PRICE_STOPS, source.minPrice, source.maxPrice, 'price'),
			rangeField('bed', 'Bed', BED_STOPS, source.minBed, source.maxBed, 'count'),
			rangeField('bath', 'Bath', BED_STOPS, source.minBath, source.maxBath, 'count'),
			{
				id: 'propertyType',
				type: 'multi',
				label: 'Type',
				cols: 2,
				options: FILTER_PROPERTY_TYPES.map((value) => ({
					name: 'propertyType[]',
					value,
					label: labelFromValue(value),
					checked: selectedTypes.has(value),
				})),
			},
			{
				id: 'propertyStatus',
				type: 'single',
				label: 'Status',
				cols: 1,
				options: FILTER_PROPERTY_STATUSES.map((option) => ({
					name: 'propertyStatus[]',
					value: option.value,
					label: option.label,
					checked: option.value === status,
				})),
			},
			{
				id: 'tags',
				type: 'tags',
				label: 'Tags',
				cols: 2,
				options: [
					{
						name: 'photo',
						value: 'true',
						label: 'Photo',
						checked: source.hasPhoto === true,
					},
					{
						name: 'construction',
						value: 'true',
						label: 'New construction',
						checked: !offMarket && source.isNewConstruction === true,
						disabled: offMarket,
					},
					{
						name: 'openhouse',
						value: 'true',
						label: 'Open house',
						checked: !offMarket && source.isOpenHousesOnly === true,
						disabled: offMarket,
					},
				],
			},
		],
	};

	return {
		name: COMPONENT_NAME,
		template: COMPONENT_TEMPLATE,
		data,
	};
}
