import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
	geoType,
	getGeoByPath,
	getPathByGeo,
	getGeoDisplayText,
} from '../geo.js';

describe('school geo path', () => {
	test('parses and rebuilds a school path', () => {
		const geo = getGeoByPath('/tx/austin/483808012358_school/');
		assert.equal(geo.type, geoType.school);
		assert.equal(geo.state, 'tx');
		assert.equal(geo.city, 'austin');
		assert.equal(geo.schoolId, '483808012358');
		assert.equal(getPathByGeo(geo), 'tx/austin/483808012358_school');
	});

	test('display text uses the school name when present', () => {
		const text = getGeoDisplayText({
			type: geoType.school,
			state: 'tx',
			city: 'austin',
			schoolId: '483808012358',
			schoolName: 'Elsa England Elementary School',
		});
		assert.equal(text, 'Elsa England Elementary School, austin, tx');
	});
});
