/**
 * Contract test for demo config get() return shape (no SOA when prId absent).
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import propertyConfig from '../property.js';
import { mapPropertyDetailToArticle } from '../../../helpers/article.js';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../..');
dotenv.config({ path: path.join(rootDir, '.env'), override: false });
dotenv.config({ path: path.join(rootDir, '.env.local'), override: true });

const cdnHost = (process.env.CDN_HOST || '').replace(/\/$/, '');

const DETAIL_COMP_KEYS = [
	'metadata',
	'title',
	'tags',
	'album',
	'paragraph',
	'record',
	'openHouses',
	'timeline',
];

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
	id: '37ac59e7-2172-4e13-9676-46de3875152e',
	listPrice: 135000,
	listingStatus: { displayName: 'Active', name: 'ACTIVE' },
	listingUrl: 'winters-tx/101-mel-st-winters-tx-79567/pid_dh5p9ng4nh/',
	photos: [{ url: `${cdnHost}/p/402/21259416_0_ZjJZN2.webp` }],
	sqftTotal: 1246,
	yearBuilt: 1958,
};

describe('property.get', () => {
	test('returns page model keys without prId (detail null)', async () => {
		const model = await propertyConfig.get({ geo: undefined, prId: undefined });

		assert.equal(model.detail, null);
		assert.ok(model.seo && typeof model.seo.title === 'string');
		assert.ok(model.articleComponent);
		assert.ok(model.headerComponent);
		assert.ok(model.footerComponent);
		assert.ok(model.welcomeImage);
		assert.equal(typeof model.articleTotalCount, 'number');
	});

	test('mapPropertyDetailToArticle keys align with comp_article_detail sections', () => {
		const detail = mapPropertyDetailToArticle(soaPureListing, { histories: [] });
		assert.ok(detail);

		for (const key of DETAIL_COMP_KEYS) {
			assert.ok(key in detail, `detail missing key: ${key}`);
		}
	});
});
