import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { getFilterByQuery, getQueryByFilter, getQueryStringByFilter } from '../filter.js';

describe('getFilterByQuery', () => {
	test('parses ranges with an open side', () => {
		const filter = getFilterByQuery({
			price: '222_3333',
			bed: '_3',
			bath: '1_',
		});
		assert.deepEqual(filter, {
			minPrice: 222,
			maxPrice: 3333,
			maxBed: 3,
			minBath: 1,
		});
	});

	test('maps lowercase multi and status enums to SOA values', () => {
		const filter = getFilterByQuery({
			'propertyType[]': ['single_family', 'condo'],
			'propertyStatus[]': 'sold',
		});
		assert.deepEqual(filter.propertyTypes, ['SINGLE_FAMILY', 'CONDO']);
		assert.equal(filter.searchPropertyStatus, 'INACTIVE');
	});

	test('omits status for for-sale and ignores unknown types', () => {
		const filter = getFilterByQuery({
			propertyType: ['land', 'castle'],
			propertyStatus: '',
		});
		assert.deepEqual(filter.propertyTypes, ['LAND']);
		assert.equal(filter.searchPropertyStatus, undefined);
	});

	test('omits false flags and resets construction when sold or rental', () => {
		const sold = getFilterByQuery({
			photo: 'false',
			construction: 'true',
			openhouse: 'true',
			'propertyStatus[]': 'rental',
		});
		assert.equal(sold.hasPhoto, undefined);
		assert.equal(sold.isNewConstruction, undefined);
		assert.equal(sold.isOpenHousesOnly, undefined);
		assert.equal(sold.searchPropertyStatus, 'FOR_RENT');

		const active = getFilterByQuery({ photo: 'true', construction: 'true' });
		assert.equal(active.hasPhoto, true);
		assert.equal(active.isNewConstruction, true);
	});

	test('reads size and index', () => {
		const filter = getFilterByQuery({
			size: '12',
			index: '2',
		});
		assert.equal(filter.maxCountPerPage, 12);
		assert.equal(filter.pageIndex, 2);
	});
});

describe('getQueryByFilter', () => {
	test('writes lowercase enums and drops off-market construction flags', () => {
		const query = getQueryByFilter({
			minPrice: 222,
			maxPrice: 3333,
			maxBed: 3,
			minBath: 1,
			propertyTypes: ['SINGLE_FAMILY', 'CONDO'],
			searchPropertyStatus: 'INACTIVE',
			hasPhoto: true,
			isNewConstruction: true,
			isOpenHousesOnly: true,
			maxCountPerPage: 12,
			pageIndex: 2,
		});
		assert.equal(query.price, '222_3333');
		assert.equal(query.bed, '_3');
		assert.equal(query.bath, '1_');
		assert.deepEqual(query['propertyType[]'], ['single_family', 'condo']);
		assert.equal(query['propertyStatus[]'], 'sold');
		assert.equal(query.photo, 'true');
		assert.equal(query.construction, undefined);
		assert.equal(query.openhouse, undefined);
		assert.equal(query.size, '12');
		assert.equal(query.index, '2');
	});

	test('query string repeats multi-select keys', () => {
		const text = getQueryStringByFilter({
			propertyTypes: ['CONDO', 'LAND'],
		});
		assert.match(text, /propertyType(?:%5B%5D|\[\])=condo/);
		assert.match(text, /propertyType(?:%5B%5D|\[\])=land/);
	});
});
