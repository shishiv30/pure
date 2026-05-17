import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
	appendPreservedQuery,
	getCanonicalDemoGeoRedirectPath,
	normalizeDemoPathCapture,
	parseSoaCityStateSegment,
	toNeighborhoodPathSegment,
} from '../../utils/demoGeoRedirect.js';

describe('normalizeDemoPathCapture', () => {
	test('strips slashes', () => {
		assert.equal(normalizeDemoPathCapture('/austin/tx/'), 'austin/tx');
		assert.equal(normalizeDemoPathCapture('//foo//'), 'foo');
	});
});

describe('parseSoaCityStateSegment', () => {
	test('parses city-state tail', () => {
		assert.deepEqual(parseSoaCityStateSegment('san-mateo-ca'), {
			citySlug: 'san-mateo',
			state: 'ca',
		});
		assert.deepEqual(parseSoaCityStateSegment('round-rock-tx'), {
			citySlug: 'round-rock',
			state: 'tx',
		});
	});
	test('returns null without valid pattern', () => {
		assert.equal(parseSoaCityStateSegment('tx'), null);
		assert.equal(parseSoaCityStateSegment('austin'), null);
	});
});

describe('toNeighborhoodPathSegment', () => {
	test('adds _neighborhood suffix', () => {
		assert.equal(toNeighborhoodPathSegment('pacific-heights'), 'pacific-heights_neighborhood');
		assert.equal(toNeighborhoodPathSegment('neighborhoodxxxx'), 'neighborhoodxxxx_neighborhood');
	});
});

describe('appendPreservedQuery', () => {
	test('preserves query string', () => {
		assert.equal(
			appendPreservedQuery({ url: '/demo/austin/tx?x=1' }, '/demo/tx/austin'),
			'/demo/tx/austin?x=1',
		);
	});
	test('no query unchanged', () => {
		assert.equal(appendPreservedQuery({ url: '/demo/x' }, '/demo/y'), '/demo/y');
	});
});

describe('getCanonicalDemoGeoRedirectPath', () => {
	test('city / state swap', () => {
		assert.equal(getCanonicalDemoGeoRedirectPath('/austin/tx'), '/demo/tx/austin');
		assert.equal(getCanonicalDemoGeoRedirectPath('round-rock/tx'), '/demo/tx/round-rock');
	});
	test('single segment city-state hyphen', () => {
		assert.equal(getCanonicalDemoGeoRedirectPath('austin-tx'), '/demo/tx/austin');
		assert.equal(getCanonicalDemoGeoRedirectPath('/san-mateo-ca'), '/demo/ca/san-mateo');
	});
	test('SOA county slug', () => {
		assert.equal(
			getCanonicalDemoGeoRedirectPath('/san-mateo-county-ca'),
			'/demo/ca/san-mateo_county',
		);
		assert.equal(
			getCanonicalDemoGeoRedirectPath('los-angeles-county-ca'),
			'/demo/ca/los-angeles_county',
		);
	});
	test('SOA city-state + neighborhood', () => {
		assert.equal(
			getCanonicalDemoGeoRedirectPath('/san-mateo-ca/pacific-heights'),
			'/demo/ca/san-mateo/pacific-heights_neighborhood',
		);
		assert.equal(
			getCanonicalDemoGeoRedirectPath('san-mateo-ca/neighborhoodxxxx'),
			'/demo/ca/san-mateo/neighborhoodxxxx_neighborhood',
		);
	});
	test('no redirect when already canonical state/city', () => {
		assert.equal(getCanonicalDemoGeoRedirectPath('tx/austin'), null);
		assert.equal(getCanonicalDemoGeoRedirectPath('ca/san-mateo'), null);
	});
	test('no redirect for ambiguous or unknown', () => {
		assert.equal(getCanonicalDemoGeoRedirectPath('foo/bar/baz'), null);
		assert.equal(getCanonicalDemoGeoRedirectPath(''), null);
	});
	test('swap not applied when first segment is SOA city-state and second is state', () => {
		// Avoid /demo/tx/san-mateo-ca garbage: second segment is a state code
		assert.equal(getCanonicalDemoGeoRedirectPath('san-mateo-ca/tx'), null);
	});
});
