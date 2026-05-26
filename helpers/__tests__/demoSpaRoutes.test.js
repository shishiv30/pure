import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
	createDemoSpaRegExp,
	matchDemoSpaRoute,
	matchDemoSpaServerRoute,
	DEMO_SPA_ROUTE_ORDER,
} from '../routes/demoSpaRoutes.js';

describe('matchDemoSpaRoute', () => {
	test('detail paths', () => {
		const m = matchDemoSpaRoute('/demo/detail/tx/78664/abc123');
		assert.equal(m?.id, 'detail');
		assert.deepEqual(m?.params, { state: 'tx', zip: '78664', prId: 'abc123' });
	});

	test('detail is case-insensitive', () => {
		const m = matchDemoSpaRoute('/demo/DETAIL/TX/78664/ABC123');
		assert.equal(m?.id, 'detail');
		assert.equal(m?.params.prId, 'ABC123');
	});

	test('map paths', () => {
		const m = matchDemoSpaRoute('/demo/tx/austin/@30.2672,-97.7431');
		assert.equal(m?.id, 'map');
		assert.equal(m?.params.state, 'tx');
		assert.equal(m?.params.geoSlug, 'austin');
		assert.equal(m?.params.coords, '@30.2672,-97.7431');
	});

	test('geo grid paths', () => {
		const m = matchDemoSpaRoute('/demo/tx/austin');
		assert.equal(m?.id, 'geo');
		assert.equal(m?.params.tail, '/tx/austin');
	});

	test('geo county slug', () => {
		const m = matchDemoSpaRoute('/demo/tx/williamson_county');
		assert.equal(m?.id, 'geo');
		assert.equal(m?.params.tail, '/tx/williamson_county');
	});

	test('map URL matches geo on server (no separate map handler)', () => {
		const path = '/demo/tx/austin/@30.2672,-97.7431';
		assert.equal(matchDemoSpaRoute(path)?.id, 'map');
		assert.equal(matchDemoSpaServerRoute(path), 'geo');
		assert.ok(createDemoSpaRegExp('geo').test(path));
	});

	test('grid path does not match detail', () => {
		assert.equal(matchDemoSpaRoute('/demo/tx/austin')?.id, 'geo');
		assert.notEqual(matchDemoSpaRoute('/demo/tx/austin')?.id, 'detail');
	});

	test('sitemap path matches geo regex (excluded by registration order on server)', () => {
		const m = matchDemoSpaRoute('/demo/sitemap');
		assert.equal(m?.id, 'geo');
	});
});

describe('createDemoSpaRegExp parity', () => {
	test('route order is detail, map, geo', () => {
		assert.deepEqual(DEMO_SPA_ROUTE_ORDER, ['detail', 'map', 'geo']);
	});

	test('first matching rule in order for ambiguous checks', () => {
		const vectors = [
			['/demo/detail/tx/78664/abc123', 'detail'],
			['/demo/tx/austin/@30.2672,-97.7431', 'map'],
			['/demo/tx/austin', 'geo'],
		];
		for (const [path, expected] of vectors) {
			assert.equal(matchDemoSpaRoute(path)?.id, expected, path);
		}
	});
});

describe('server geo catch-all charset', () => {
	test('map coordinates match geo regex', () => {
		const geo = createDemoSpaRegExp('geo');
		assert.ok(geo.test('/demo/tx/austin/@30.5,-97.5'));
	});

	test('legacy catch-all would not match map coords', () => {
		const legacy = /^\/demo([\/\w\-]+)\/?$/;
		assert.ok(!legacy.test('/demo/tx/austin/@30.5,-97.5'));
	});
});
