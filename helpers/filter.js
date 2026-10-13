/**
 * Demo listing query string ↔ SOA nearby-search filter fields.
 * URL enums are lowercase. SOA enums are uppercase.
 */

const PROPERTY_TYPES = [
	'single_family',
	'condo',
	'townhouse',
	'multi_family',
	'mobile',
	'land',
	'other',
];

const PROPERTY_TYPE_SET = new Set(PROPERTY_TYPES);

const STATUS_TO_SOA = {
	sold: 'INACTIVE',
	rental: 'FOR_RENT',
};

const SOA_TO_STATUS = {
	INACTIVE: 'sold',
	FOR_RENT: 'rental',
};

const RANGE_FIELDS = [
	{ key: 'price', min: 'minPrice', max: 'maxPrice' },
	{ key: 'bed', min: 'minBed', max: 'maxBed' },
	{ key: 'bath', min: 'minBath', max: 'maxBath' },
];

const FLAG_FIELDS = [
	{ key: 'photo', soa: 'hasPhoto' },
	{ key: 'construction', soa: 'isNewConstruction' },
	{ key: 'openhouse', soa: 'isOpenHousesOnly' },
];

function asList(query, key) {
	const raw = query[`${key}[]`] !== undefined ? query[`${key}[]`] : query[key];
	if (raw == null || raw === '') {
		return [];
	}
	const list = Array.isArray(raw) ? raw : [raw];
	return list.map((value) => String(value).trim().toLowerCase()).filter(Boolean);
}

function parseRange(value) {
	if (typeof value !== 'string' || !value.includes('_')) {
		return null;
	}
	const parts = value.split('_');
	if (parts.length !== 2) {
		return null;
	}
	const [minRaw, maxRaw] = parts;
	const min = minRaw === '' ? undefined : Number(minRaw);
	const max = maxRaw === '' ? undefined : Number(maxRaw);
	if (minRaw !== '' && !Number.isFinite(min)) {
		return null;
	}
	if (maxRaw !== '' && !Number.isFinite(max)) {
		return null;
	}
	if (min === undefined && max === undefined) {
		return null;
	}
	return { min, max };
}

function formatRange(min, max) {
	if (min === undefined && max === undefined) {
		return '';
	}
	const minText = min === undefined || min === null || min === '' ? '' : String(min);
	const maxText = max === undefined || max === null || max === '' ? '' : String(max);
	if (minText === '' && maxText === '') {
		return '';
	}
	return `${minText}_${maxText}`;
}

function parseNumber(value) {
	if (value == null || value === '') {
		return undefined;
	}
	const number = Number(Array.isArray(value) ? value[0] : value);
	if (!Number.isFinite(number)) {
		return undefined;
	}
	return number;
}

function isOffMarket(status) {
	return status === 'INACTIVE' || status === 'FOR_RENT';
}

/**
 * @param {Record<string, unknown>} [query]
 * @returns {Record<string, unknown>}
 */
export function getFilterByQuery(query = {}) {
	const filter = {};
	const source = query && typeof query === 'object' ? query : {};

	for (const field of RANGE_FIELDS) {
		const raw = source[field.key];
		const value = Array.isArray(raw) ? raw[0] : raw;
		const range = parseRange(typeof value === 'string' ? value : '');
		if (!range) {
			continue;
		}
		if (range.min !== undefined) {
			filter[field.min] = range.min;
		}
		if (range.max !== undefined) {
			filter[field.max] = range.max;
		}
	}

	const propertyTypes = asList(source, 'propertyType').filter((value) => PROPERTY_TYPE_SET.has(value));
	if (propertyTypes.length) {
		filter.propertyTypes = propertyTypes.map((value) => value.toUpperCase());
	}

	const status = asList(source, 'propertyStatus')[0];
	if (status && STATUS_TO_SOA[status]) {
		filter.searchPropertyStatus = STATUS_TO_SOA[status];
	}

	for (const field of FLAG_FIELDS) {
		const raw = Array.isArray(source[field.key]) ? source[field.key][0] : source[field.key];
		if (String(raw).toLowerCase() === 'true') {
			filter[field.soa] = true;
		}
	}

	if (isOffMarket(filter.searchPropertyStatus)) {
		delete filter.isNewConstruction;
		delete filter.isOpenHousesOnly;
	}

	const pageSize = parseNumber(source.size);
	if (pageSize !== undefined) {
		filter.maxCountPerPage = pageSize;
	}
	const pageIndex = parseNumber(source.index);
	if (pageIndex !== undefined) {
		filter.pageIndex = pageIndex;
	}

	const schoolRaw = Array.isArray(source.schoolId) ? source.schoolId[0] : source.schoolId;
	const schoolId = schoolRaw == null ? '' : String(schoolRaw).trim();
	if (schoolId) {
		filter.schoolId = schoolId;
	}

	return filter;
}

/**
 * @param {Record<string, unknown>} [filter]
 * @returns {Record<string, string | string[]>}
 */
export function getQueryByFilter(filter = {}) {
	const query = {};
	const source = filter && typeof filter === 'object' ? filter : {};
	const offMarket = isOffMarket(source.searchPropertyStatus);

	for (const field of RANGE_FIELDS) {
		const hasMin = source[field.min] !== undefined && source[field.min] !== null && source[field.min] !== '';
		const hasMax = source[field.max] !== undefined && source[field.max] !== null && source[field.max] !== '';
		if (!hasMin && !hasMax) {
			continue;
		}
		const text = formatRange(hasMin ? source[field.min] : '', hasMax ? source[field.max] : '');
		if (text) {
			query[field.key] = text;
		}
	}

	if (Array.isArray(source.propertyTypes) && source.propertyTypes.length) {
		const values = source.propertyTypes
			.map((value) => String(value).trim().toLowerCase())
			.filter((value) => PROPERTY_TYPE_SET.has(value));
		if (values.length) {
			query['propertyType[]'] = values;
		}
	}

	const status = SOA_TO_STATUS[source.searchPropertyStatus];
	if (status) {
		query['propertyStatus[]'] = status;
	}

	for (const field of FLAG_FIELDS) {
		if (offMarket && (field.key === 'construction' || field.key === 'openhouse')) {
			continue;
		}
		if (source[field.soa] === true) {
			query[field.key] = 'true';
		}
	}

	if (source.maxCountPerPage !== undefined && source.maxCountPerPage !== null && source.maxCountPerPage !== '') {
		query.size = String(source.maxCountPerPage);
	}
	if (source.pageIndex !== undefined && source.pageIndex !== null && source.pageIndex !== '') {
		query.index = String(source.pageIndex);
	}
	if (source.schoolId) {
		query.schoolId = String(source.schoolId);
	}

	return query;
}

/**
 * @param {Record<string, unknown>} [filter]
 * @returns {string}
 */
export function getQueryStringByFilter(filter = {}) {
	const query = getQueryByFilter(filter);
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(query)) {
		if (Array.isArray(value)) {
			value.forEach((item) => params.append(key, item));
		} else if (value !== undefined && value !== '') {
			params.append(key, String(value));
		}
	}
	return params.toString();
}

export const FILTER_PROPERTY_TYPES = PROPERTY_TYPES;
export const FILTER_PROPERTY_STATUSES = [
	{ value: '', label: 'For sale' },
	{ value: 'sold', label: 'Sold' },
	{ value: 'rental', label: 'Rental' },
];
