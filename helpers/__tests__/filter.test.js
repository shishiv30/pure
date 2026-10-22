import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
	getFilterByQuery,
	getQueryByFilter,
	getQueryStringByFilter,
	toSoaSearchFilter,
} from '../filter.js';

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
			propertyType: ['land', 'castle', 'townhouse'],
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
		assert.equal(sold.searchPropertyStatus, 'RENTAL');

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

	test('reads sort and order as SOA uppercase', () => {
		const filter = getFilterByQuery({
			sort: 'price',
			order: 'asc',
		});
		assert.equal(filter.sortColumn, 'PRICE');
		assert.equal(filter.sortOrder, 'ASC');
	});

	test('ignores unknown sort columns and orders', () => {
		const filter = getFilterByQuery({
			sort: 'sqft',
			order: 'random',
		});
		assert.equal(filter.sortColumn, undefined);
		assert.equal(filter.sortOrder, undefined);
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
			sortColumn: 'PRICE',
			sortOrder: 'DESC',
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
		assert.equal(query.sort, 'price');
		assert.equal(query.order, 'desc');
	});

	test('query string repeats multi-select keys', () => {
		const text = getQueryStringByFilter({
			propertyTypes: ['CONDO', 'LAND'],
		});
		assert.match(text, /propertyType(?:%5B%5D|\[\])=condo/);
		assert.match(text, /propertyType(?:%5B%5D|\[\])=land/);
	});

	test('writes single_family from SINGLE_FAMILY_HOUSE', () => {
		const query = getQueryByFilter({
			propertyTypes: ['SINGLE_FAMILY_HOUSE'],
		});
		assert.deepEqual(query['propertyType[]'], ['single_family']);
	});
});

describe('toSoaSearchFilter', () => {
	test('maps single_family and FOR_RENT; flags to 1', () => {
		const soa = toSoaSearchFilter({
			propertyTypes: ['SINGLE_FAMILY', 'CONDO'],
			searchPropertyStatus: 'FOR_RENT',
			hasPhoto: true,
			isNewConstruction: true,
			isOpenHousesOnly: true,
		});
		assert.deepEqual(soa.propertyTypes, ['SINGLE_FAMILY_HOUSE', 'CONDO']);
		assert.equal(soa.searchPropertyStatus, 'RENTAL');
		assert.equal(soa.hasPhoto, 1);
		assert.equal(soa.isNewConstruction, 1);
		assert.equal(soa.isOpenHousesOnly, 1);
	});
});
