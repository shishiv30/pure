import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { searchHouseByValue, VALUE_SORT } from '../../utils/valueSort.js';

const listing = (id, listPrice, sqft) => ({ id, listPrice, lotSizeSqft: sqft, listingStatus: { name: 'ACTIVE' } });

function fakeSoa(listings) {
	const calls = [];
	const fetchPage = async (filter) => {
		calls.push(filter);
		const start = (filter.pageIndex - 1) * filter.maxCountPerPage;
		return { totalCount: listings.length, listings: listings.slice(start, start + filter.maxCountPerPage) };
	};
	return { calls, fetchPage };
}

describe('searchHouseByValue', () => {
	const pool = [
		listing('a', 100000, 1000), // $100/sqft
		listing('b', 50000, 10000), // $5/sqft
		listing('c', 1, 43560), // placeholder price: out
		listing('d', 14000, 1983722400), // acres stored as sqft: out
		listing('e', 300000, 20000), // $15/sqft
		{ id: 'f', listPrice: 90000, listingStatus: { name: 'ACTIVE' } }, // no size: out
	];

	test('lowest $/sqft first, junk left out, SOA sort and paging stripped', async () => {
		const { calls, fetchPage } = fakeSoa(pool);
		const r = await searchHouseByValue(fetchPage, { state: 'az', type: 'state', t: 1 }, { sortColumn: VALUE_SORT, sortOrder: 'ASC', propertyTypes: ['LAND'] });
		assert.deepEqual(r.listings.map((l) => l.id), ['b', 'e', 'a']);
		assert.deepEqual(r.valueSort, { ranked: 3, scanned: 6, total: 6 });
		assert.equal(r.totalCount, 3);
		assert.equal(calls[0].sortColumn, undefined);
		assert.equal(calls[0].maxCountPerPage, 400);
		assert.deepEqual(calls[0].propertyTypes, ['LAND']);
	});

	test('desc reverses; pages slice the ranking', async () => {
		const { fetchPage } = fakeSoa(pool);
		const geo = { state: 'az', type: 'state', t: 2 };
		const desc = await searchHouseByValue(fetchPage, geo, { sortColumn: VALUE_SORT, sortOrder: 'DESC' });
		assert.deepEqual(desc.listings.map((l) => l.id), ['a', 'e', 'b']);
		const page2 = await searchHouseByValue(fetchPage, geo, { sortColumn: VALUE_SORT, maxCountPerPage: 2, pageIndex: 2 });
		assert.deepEqual(page2.listings.map((l) => l.id), ['a']);
	});
});
