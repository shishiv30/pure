import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { mapPropertyToArticle } from '../article.js';
import { geoType } from '../geo.js';
import {
	collectPhotoUrls,
	mapSOADataListToArticles,
	mapSOADataToMetadata,
	toSoaPreviewPhotoUrl,
} from '../property.js';

/** Minimal SOA Pure listing (subset of production shape). */
const soaPureListing = {
	address: {
		addressInfo: '101 Mel St',
		city: 'Winters',
		county: 'Runnels County',
		state: 'TX',
		zipCode: '79567',
	},
	bathroomsTotal: 1,
	bedrooms: 3,
	currentOpenHouses: [],
	daysOnMarket: 12,
	id: '37ac59e7-2172-4e13-9676-46de3875152e',
	listPrice: 135000,
	listingStatus: {
		displayName: 'Active Under Contract',
		name: 'PENDING',
	},
	listingUrl: 'winters-tx/101-mel-st-winters-tx-79567/pid_dh5p9ng4nh/',
	lotSizeSqft: 8233,
	officeListName: 'Hunter Ranch and Realty',
	photoCount: 29,
	photos: [
		{ url: 'https://pi.movoto.com/p/402/21259416_0_ZjJZN2.webp' },
		{ url: 'https://pi.movoto.com/p/402/21259416_0_YVZb7M.webp' },
	],
	priceChangeAmount: null,
	sqftTotal: 1246,
	yearBuilt: 1958,
};

describe('mapSOADataToMetadata', () => {
	test('returns null for invalid input', () => {
		assert.equal(mapSOADataToMetadata(null), null);
		assert.equal(mapSOADataToMetadata(undefined), null);
		assert.equal(mapSOADataToMetadata('listing'), null);
	});

	test('returns null when id is missing', () => {
		assert.equal(mapSOADataToMetadata({ listPrice: 100 }), null);
	});

	test('returns raw metadata fields from SOA Pure listing', () => {
		const meta = mapSOADataToMetadata(soaPureListing);
		assert.equal(meta.propertyId, soaPureListing.id);
		assert.equal(meta.geo.state, 'TX');
		assert.equal(meta.geo.city, 'Winters');
		assert.equal(meta.geo.county, 'Runnels County');
		assert.equal(meta.geo.zipcode, '79567');
		assert.equal(meta.geo.address, '101 Mel St');
		assert.equal(meta.geo.type, geoType.address);
		assert.equal(meta.geo.path, 'tx/winters/101-mel-st_address');
		assert.equal(meta.bed, 3);
		assert.equal(meta.bath, 1);
		assert.equal(meta.price, 135000);
		assert.deepEqual(meta.listingStatus, soaPureListing.listingStatus);
		assert.deepEqual(meta.openHouses, []);
		assert.equal(meta.priceChange, null);
		assert.equal(meta.sqftTotal, 1246);
		assert.equal(meta.lotSizeSqft, 8233);
		assert.equal(meta.yearBuilt, 1958);
		assert.deepEqual(meta.photos, [
			'https://pi.movoto.com/p/402/21259416_0_ZjJZN2_p.webp',
			'https://pi.movoto.com/p/402/21259416_0_YVZb7M_p.webp',
		]);
		assert.equal(meta.photoCount, 29);
		assert.equal(meta.officeListName, 'Hunter Ranch and Realty');
		assert.equal(meta.daysOnMarket, 12);
		assert.equal(meta.listingUrl, soaPureListing.listingUrl);
	});

	test('price uses closePrice when listing is sold', () => {
		const meta = mapSOADataToMetadata({
			...soaPureListing,
			listPrice: 135000,
			closePrice: 128000,
		});
		assert.equal(meta.price, 128000);
	});

	test('collectPhotoUrls reads photos[].url from SOA Pure', () => {
		assert.deepEqual(collectPhotoUrls(soaPureListing), [
			'https://pi.movoto.com/p/402/21259416_0_ZjJZN2_p.webp',
			'https://pi.movoto.com/p/402/21259416_0_YVZb7M_p.webp',
		]);
	});

	test('toSoaPreviewPhotoUrl normalizes webp suffixes to _p.webp', () => {
		const base = 'https://pi.movoto.com/p/402/21259416_0_ZjJZN2';
		assert.equal(toSoaPreviewPhotoUrl(`${base}.webp`), `${base}_p.webp`);
		assert.equal(toSoaPreviewPhotoUrl(`${base}_r.webp`), `${base}_p.webp`);
		assert.equal(toSoaPreviewPhotoUrl(`${base}_l.webp`), `${base}_p.webp`);
		assert.equal(toSoaPreviewPhotoUrl(`${base}_p.webp`), `${base}_p.webp`);
		assert.equal(toSoaPreviewPhotoUrl(`${base}.WEBP`), `${base}_p.webp`);
		assert.equal(toSoaPreviewPhotoUrl(`${base}_R.WEBP`), `${base}_p.webp`);
	});
});

describe('mapPropertyToArticle', () => {
	test('builds article card from SOA metadata', () => {
		const meta = mapSOADataToMetadata(soaPureListing);
		const article = mapPropertyToArticle(meta);
		assert.equal(article.metadata.propertyId, soaPureListing.id);
		assert.equal(article.img, meta.photos[0]);
		assert.equal(
			article.path,
			`/demo/detail/${meta.geo.state.toLowerCase()}/${meta.geo.zipcode}/${soaPureListing.id}`,
		);
		assert.equal(
			article.title,
			'101 Mel St, Winters, Runnels County, TX 79567',
		);
		assert.equal(article.imgTag, 'Hunter Ranch and Realty');
		assert.deepEqual(article.tags, [{ text: 'Pending', className: 'tip' }]);
		assert.deepEqual(article.attrs, [
			{ key: 'Est', value: '$135,000', desc: 'Estimate Price' },
			{ key: 'Bd', value: 3, desc: 'Bedrooms' },
			{ key: 'Ba', value: 1, desc: 'Bathrooms' },
			{ key: 'Sqft', value: '1,246 sqft', desc: 'Lot Size' },
			{ key: '/Sqft', value: '108', desc: 'Price Per Sqft' },
			{ key: 'Yr', value: 1958, desc: 'Year Built' },
		]);
	});
});

describe('mapSOADataListToArticles', () => {
	test('maps array and drops invalid rows', () => {
		const articles = mapSOADataListToArticles([soaPureListing, null, { listPrice: 1 }]);
		assert.equal(articles.length, 1);
		assert.equal(articles[0].metadata.propertyId, soaPureListing.id);
	});

	test('returns empty array for non-array input', () => {
		assert.deepEqual(mapSOADataListToArticles(null), []);
	});
});
