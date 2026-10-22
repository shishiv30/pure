import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
	appendPreservedQuery,
	getCanonicalPropertyGeoRedirectPath,
	normalizePropertyPathCapture,
	parseSoaCityStateSegment,
	toNeighborhoodPathSegment,
} from '../../utils/propertyGeoRedirect.js';

describe('normalizePropertyPathCapture', () => {
	test('strips slashes', () => {
		assert.equal(normalizePropertyPathCapture('/austin/tx/'), 'austin/tx');
		assert.equal(normalizePropertyPathCapture('//foo//'), 'foo');
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
			appendPreservedQuery({ url: '/property/austin/tx?x=1' }, '/property/tx/austin'),
			'/property/tx/austin?x=1',
		);
	});
	test('no query unchanged', () => {
		assert.equal(appendPreservedQuery({ url: '/property/x' }, '/property/y'), '/property/y');
	});
});

describe('getCanonicalPropertyGeoRedirectPath', () => {
	test('city / state swap', () => {
		assert.equal(getCanonicalPropertyGeoRedirectPath('/austin/tx'), '/property/tx/austin');
		assert.equal(getCanonicalPropertyGeoRedirectPath('round-rock/tx'), '/property/tx/round-rock');
	});
	test('single segment city-state hyphen', () => {
		assert.equal(getCanonicalPropertyGeoRedirectPath('austin-tx'), '/property/tx/austin');
		assert.equal(getCanonicalPropertyGeoRedirectPath('/san-mateo-ca'), '/property/ca/san-mateo');
	});
	test('SOA county slug', () => {
		assert.equal(
			getCanonicalPropertyGeoRedirectPath('/san-mateo-county-ca'),
			'/property/ca/san-mateo_county',
		);
		assert.equal(
			getCanonicalPropertyGeoRedirectPath('los-angeles-county-ca'),
			'/property/ca/los-angeles_county',
		);
	});
	test('SOA city-state + neighborhood', () => {
		assert.equal(
			getCanonicalPropertyGeoRedirectPath('/san-mateo-ca/pacific-heights'),
			'/property/ca/san-mateo/pacific-heights_neighborhood',
		);
		assert.equal(
			getCanonicalPropertyGeoRedirectPath('san-mateo-ca/neighborhoodxxxx'),
			'/property/ca/san-mateo/neighborhoodxxxx_neighborhood',
		);
	});
	test('no redirect when already canonical state/city', () => {
		assert.equal(getCanonicalPropertyGeoRedirectPath('tx/austin'), null);
		assert.equal(getCanonicalPropertyGeoRedirectPath('ca/san-mateo'), null);
	});
	test('no redirect for ambiguous or unknown', () => {
		assert.equal(getCanonicalPropertyGeoRedirectPath('foo/bar/baz'), null);
		assert.equal(getCanonicalPropertyGeoRedirectPath(''), null);
	});
	test('swap not applied when first segment is SOA city-state and second is state', () => {
		// Avoid /property/tx/san-mateo-ca garbage: second segment is a state code
		assert.equal(getCanonicalPropertyGeoRedirectPath('san-mateo-ca/tx'), null);
	});
});
