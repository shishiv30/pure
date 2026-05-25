import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
	mapAlbumToComp,
	mapParagraphToComp,
	buildDetailSeo,
	mapGroupedFeaturesToAttrs,
	mapPropertyDetailToArticle,
	mapPropertyToArticle,
	mapPropertyToAttrs,
	mapRecordToComp,
	mapSOADataListToArticles,
	mapTagsToComp,
} from '../article.js';
import { geoType } from '../geo.js';
import {
	collectPhotoUrls,
	mapHistoryRowsToTimelineComp,
	mapOpenHousesToComp,
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
	mlsPublicRecordAssociation: {
		id: '45a6f0ff-21ec-45f6-8a35-69de1bc9368d',
	},
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

	test('includes detail fields from SOA Pure listing', () => {
		const meta = mapSOADataToMetadata({
			...soaPureListing,
			publicRemarks: 'Quiet street.',
			agentListFullName: 'Jane Agent',
		});
		assert.equal(meta.description, 'Quiet street.');
		assert.equal(meta.agentListFullName, 'Jane Agent');
	});

	test('adds sorted histories when historiesRaw is provided', () => {
		const historiesRaw = {
			histories: [{ eventDate: '2024-06-01', eventType: 'Listed', price: 135000 }],
		};
		const meta = mapSOADataToMetadata(soaPureListing, historiesRaw);
		assert.equal(meta.histories.length, 1);
		assert.equal(meta.histories[0].date, '2024-06-01');
		assert.equal(meta.histories[0].title, 'Listed');
		assert.equal(meta.histories[0].subtitle, '$135,000');
		assert.equal(meta.datelist, undefined);
		assert.equal(meta.timeline, undefined);
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
		assert.equal(meta.area, 1246);
		assert.equal(meta.areaUnit, 'Sqft');
		assert.equal(meta.areaDisplay, '1,246 sqft');
		assert.equal(meta.pricePerArea, 135000 / 1246);
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

	test('price uses soldPrice when listing is sold', () => {
		const meta = mapSOADataToMetadata({
			...soaPureListing,
			listPrice: 135000,
			closePrice: 128000,
			soldPrice: 128000,
			listingStatus: { name: 'SOLD', displayName: 'Sold' },
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

describe('mapGroupedFeaturesToAttrs', () => {
	test('parses JSON string and merges non-empty groups', () => {
		const attrs = mapGroupedFeaturesToAttrs(
			'{"cooling":["Electric"],"heating":["Electric"],"levels":["Traditional","Free Standing"],"virtualTour":[]}',
		);
		assert.deepEqual(attrs, [
			{ key: 'Cooling', value: 'Electric', desc: 'Cooling' },
			{ key: 'Heating', value: 'Electric', desc: 'Heating' },
			{ key: 'Levels', value: 'Traditional, Free Standing', desc: 'Levels' },
		]);
	});

	test('returns empty array for invalid input', () => {
		assert.deepEqual(mapGroupedFeaturesToAttrs(null), []);
		assert.deepEqual(mapGroupedFeaturesToAttrs('not-json'), []);
	});
});

describe('mapPropertyToAttrs', () => {
	test('merges groupedFeatures when allAttrs is true', () => {
		const meta = mapSOADataToMetadata({
			...soaPureListing,
			groupedFeatures: {
				cooling: ['Electric'],
				heating: ['Electric'],
			},
		});
		const attrs = mapPropertyToAttrs(meta, true);
		assert.ok(attrs.some((a) => a.key === 'Cooling'));
		assert.ok(attrs.some((a) => a.key === 'Heating'));
		assert.ok(!attrs.some((a) => a.key === 'Features'));
	});
});

describe('mapPropertyToArticle', () => {
	test('builds article card from SOA metadata', () => {
		const meta = mapSOADataToMetadata(soaPureListing);
		const article = mapPropertyToArticle(meta);
		assert.equal(article.metadata.propertyId, soaPureListing.id);
		assert.equal(article.metadata.prId, soaPureListing.mlsPublicRecordAssociation.id);
		assert.equal(article.img, meta.photos[0]);
		assert.equal(
			article.path,
			`/demo/detail/${meta.geo.state.toLowerCase()}/${meta.geo.zipcode}/${meta.prId}`,
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

describe('detail comp mappers', () => {
	test('mapTagsToComp', () => {
		assert.deepEqual(mapTagsToComp([{ text: 'Pending', className: 'tip' }]), {
			items: [{ text: 'Pending', className: 'tip' }],
		});
		assert.equal(mapTagsToComp([]), null);
	});

	test('mapAlbumToComp', () => {
		const album = mapAlbumToComp(['https://example.com/a.webp'], '101 Mel St');
		assert.equal(album.images.length, 1);
		assert.equal(album.alt, '101 Mel St');
		assert.equal(mapAlbumToComp([]), null);
	});

	test('mapParagraphToComp', () => {
		assert.deepEqual(mapParagraphToComp('Hello'), { text: 'Hello' });
		assert.equal(mapParagraphToComp(''), null);
	});

	test('mapRecordToComp', () => {
		const attrs = [{ key: 'Bd', value: 3, desc: 'Bedrooms' }];
		assert.deepEqual(mapRecordToComp(attrs), { heading: 'Facts', items: attrs });
		assert.equal(mapRecordToComp([]), null);
	});
});

describe('mapPropertyDetailToArticle', () => {
	test('returns comp render models only', () => {
		const detail = mapPropertyDetailToArticle(
			{ ...soaPureListing, publicRemarks: 'Spacious home on a quiet street.' },
			{
				histories: [{ eventDate: '2024-06-01', eventType: 'Listed', price: 135000 }],
			},
		);
		assert.equal(detail.title, '101 Mel St, Winters, Runnels County, TX 79567');
		assert.equal(detail.paragraph.text, 'Spacious home on a quiet street.');
		assert.equal(detail.album.images.length, 2);
		assert.equal(detail.album.alt, detail.title);
		assert.equal(detail.record.heading, 'Facts');
		assert.equal(detail.record.items.length, 9);
		assert.ok(detail.timeline);
		assert.equal(detail.metadata.propertyId, soaPureListing.id);
		assert.equal(detail.attrs, undefined);
	});

	test('buildDetailSeo uses metadata and comp models', () => {
		const detail = mapPropertyDetailToArticle(soaPureListing);
		const seo = buildDetailSeo(detail);
		assert.match(seo.title, /101 Mel St/);
		assert.match(seo.title, /Active Under Contract/);
		assert.equal(buildDetailSeo(null), null);
	});

	test('returns null for invalid listing', () => {
		assert.equal(mapPropertyDetailToArticle(null), null);
		assert.equal(mapPropertyDetailToArticle({ listPrice: 1 }), null);
	});

	test('omits timeline when histories are not provided', () => {
		const detail = mapPropertyDetailToArticle(soaPureListing);
		assert.equal(detail.album.images.length, 2);
		assert.equal(detail.timeline, null);
	});
});

describe('mapOpenHousesToComp', () => {
	test('returns comp shape for non-empty open house list', () => {
		const comp = mapOpenHousesToComp([{ startDate: '2024-07-04', startTime: '1:00 PM' }]);
		assert.equal(comp.heading, 'Open Houses');
		assert.equal(comp.items.length, 1);
	});

	test('returns null when open houses are empty', () => {
		assert.equal(mapOpenHousesToComp([]), null);
		assert.equal(mapOpenHousesToComp(null), null);
	});
});

describe('mapHistoryRowsToTimelineComp', () => {
	test('maps sorted history rows to comp_timeline entries', () => {
		const comp = mapHistoryRowsToTimelineComp([
			{ date: '2024-01-15', title: 'Sold', subtitle: '$128,000' },
		]);
		assert.ok(comp);
		assert.equal(comp.heading, 'History');
		assert.equal(comp.entries.length, 1);
		assert.equal(comp.entries[0].type, 'desc');
		assert.equal(comp.entries[0].date, '2024-01-15');
		assert.equal(comp.entries[0].text, 'Sold — $128,000');
	});

	test('returns null when rows are empty', () => {
		assert.equal(mapHistoryRowsToTimelineComp(null), null);
		assert.equal(mapHistoryRowsToTimelineComp([]), null);
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
