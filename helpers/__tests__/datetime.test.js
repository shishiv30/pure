import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
	stringToDate,
	dateToString,
	timeToString,
	timeDiff,
} from '../datetime.js';

describe('datetime', () => {
	test('stringToDate parses ISO and US date strings', () => {
		const iso = stringToDate('2024-06-15T14:30:00.000Z');
		assert.ok(iso instanceof Date);
		assert.equal(dateToString(iso, 'MM/DD/YYYY'), '06/15/2024');

		const us = stringToDate('03/04/2025');
		assert.equal(dateToString(us, 'MM/DD/YYYY'), '03/04/2025');

		const usTrimmed = stringToDate('  01/02/2024  ');
		assert.equal(dateToString(usTrimmed, 'MM/DD/YYYY'), '01/02/2024');

		assert.equal(stringToDate('not-a-date'), null);
	});

	test('stringToDate converts ISO and US date-only strings', () => {
		const isoDateOnly = stringToDate('2027-05-01');
		assert.ok(isoDateOnly instanceof Date);
		assert.equal(isoDateOnly.toISOString(), '2027-05-01T00:00:00.000Z');

		const usDateOnly = stringToDate('05/31/2023');
		assert.ok(usDateOnly instanceof Date);
		assert.equal(dateToString(usDateOnly, 'MM/DD/YYYY'), '05/31/2023');

		const usDashed = stringToDate('08-23-2023');
		assert.ok(usDashed instanceof Date);
		assert.equal(dateToString(usDashed, 'MM/DD/YYYY'), '08/23/2023');
	});

	test('stringToDate converts time-only string to today', () => {
		const today = new Date();
		const parsed = stringToDate('09:35:00');
		assert.ok(parsed instanceof Date);
		assert.equal(parsed.getFullYear(), today.getFullYear());
		assert.equal(parsed.getMonth(), today.getMonth());
		assert.equal(parsed.getDate(), today.getDate());
		assert.equal(timeToString(parsed, 'HH:MM:SS'), '09:35:00');
	});

	test('stringToDate returns null for empty or unparseable', () => {
		assert.equal(stringToDate(null), null);
		assert.equal(stringToDate(''), null);
		assert.equal(stringToDate('2024-13-40'), null);
		assert.equal(stringToDate('not-a-date'), null);
	});

	test('dateToString and timeToString format tokens', () => {
		const date = new Date(2024, 5, 15, 9, 5, 7);
		assert.equal(dateToString(date, 'MM/DD/YYYY'), '06/15/2024');
		assert.equal(dateToString(date, 'YYYY-MM-DD'), '2024-06-15');
		assert.equal(timeToString(date, 'HH:MM:SS'), '09:05:07');
	});

	test('dateToString and timeToString accept number and ISO string', () => {
		const local = new Date(2024, 7, 10, 12, 0, 5);
		assert.equal(dateToString(local.getTime(), 'MM/DD/YYYY'), '08/10/2024');
		assert.equal(timeToString(local.getTime(), 'HH:MM:SS'), '12:00:05');
		assert.equal(dateToString('2024-08-10T12:00:05', 'YYYY-MM-DD'), '2024-08-10');
	});

	test('dateToString and timeToString return empty for invalid input', () => {
		assert.equal(dateToString(new Date(Number.NaN), 'MM/DD/YYYY'), '');
		assert.equal(dateToString('not-a-date', 'MM/DD/YYYY'), '');
		assert.equal(timeToString(Number.NaN, 'HH:MM:SS'), '');
	});

	test('dateToString returns empty for unsupported types', () => {
		assert.equal(dateToString(undefined, 'MM/DD/YYYY'), '');
		assert.equal(timeToString(undefined, 'HH:MM:SS'), '');
	});

	test('timeDiff uses now when compareDate is null', () => {
		const now = Date.now();
		const twoMinAgo = new Date(now - 2 * 60 * 1000);
		assert.equal(timeDiff(twoMinAgo), 'Just Now');

		const twentyMinAgo = new Date(now - 20 * 60 * 1000);
		assert.equal(timeDiff(twentyMinAgo), '20 min ago');

		const threeMinSoon = new Date(now + 3 * 60 * 1000);
		assert.equal(timeDiff(threeMinSoon), 'Just Now');
	});

	test('timeDiff thresholds', () => {
		const base = new Date('2024-01-15T12:00:00.000Z');

		assert.equal(timeDiff(new Date(base.getTime() - 2 * 60 * 1000), base), 'Just Now');
		assert.equal(
			timeDiff(new Date(base.getTime() - 5 * 60 * 1000), base),
			'5 min ago',
		);
		assert.equal(timeDiff(new Date(base.getTime() - 20 * 60 * 1000), base), '20 min ago');
		assert.equal(timeDiff(new Date(base.getTime() + 5 * 60 * 60 * 1000), base), '5 hr soon');
		assert.equal(
			timeDiff(new Date(base.getTime() + 47 * 60 * 60 * 1000 + 59 * 60 * 1000), base),
			'47 hr soon',
		);
		assert.equal(
			timeDiff(new Date(base.getTime() - 10 * 24 * 60 * 60 * 1000), base),
			'10 days ago',
		);
		assert.equal(
			timeDiff(new Date(base.getTime() - 29 * 24 * 60 * 60 * 1000), base),
			'29 days ago',
		);
		assert.equal(
			timeDiff(new Date(base.getTime() - 45 * 24 * 60 * 60 * 1000), base),
			'1 monthes ago',
		);
		assert.equal(
			timeDiff(new Date(base.getTime() - 400 * 24 * 60 * 60 * 1000), base),
			'1 years ago',
		);
	});

	test('timeDiff monthes soon and invalid compareDate', () => {
		const base = new Date('2024-06-01T12:00:00.000Z');
		assert.equal(
			timeDiff(new Date('2024-08-01T12:00:00.000Z'), base),
			'2 monthes soon',
		);
		assert.equal(timeDiff(base, 'not valid'), '');
	});

	test('timeDiff accepts ISO strings for both arguments', () => {
		assert.equal(
			timeDiff('2024-01-20T12:00:00.000Z', '2024-01-15T12:00:00.000Z'),
			'5 days soon',
		);
	});

	test('timeDiff empty when primary date is invalid', () => {
		assert.equal(timeDiff('invalid-date', new Date()), '');
	});
});
