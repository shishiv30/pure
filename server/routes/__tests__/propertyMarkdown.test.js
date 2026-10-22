import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
	sendPropertyMarkdown,
	sendSchoolsMarkdown,
	sendSitemapMarkdown,
	stripMarkdownExt,
	toMarkdownUrl,
} from '../../utils/propertyMarkdown.js';

function fakeRes() {
	const res = { statusCode: 200, headers: {}, body: '' };
	res.set = (k, v) => ((res.headers[k] = v), res);
	res.type = (v) => ((res.headers['Content-Type'] = v), res);
	res.status = (code) => ((res.statusCode = code), res);
	res.send = (body) => ((res.body = body), res);
	return res;
}

function fakeReq(path, query = {}) {
	const qs = new URLSearchParams(query).toString();
	return { path, query, originalUrl: `${path}.md${qs ? `?${qs}` : ''}` };
}

const article = {
	title: '1 Main St, Austin, TX 78701',
	path: '/property/detail/tx/78701/abc-123',
	tags: [{ text: 'Open' }, { text: '$10K', icon: 'arrow-circle-down' }],
	metadata: { price: 450000, bed: 3, bath: 2, areaDisplay: '1,850 sqft', listingStatus: { name: 'Active' } },
};

describe('markdown URLs', () => {
	test('strips .md', () => {
		assert.equal(stripMarkdownExt('/property/tx/austin.md'), '/property/tx/austin');
		assert.equal(stripMarkdownExt('/property/tx/austin'), null);
	});
	test('adds .md before the query', () => {
		assert.equal(toMarkdownUrl('/property/tx/austin/', '?bed=3_'), '/property/tx/austin.md?bed=3_');
	});
});

describe('sendPropertyMarkdown', () => {
	test('search lists homes with detail and md links', () => {
		const res = fakeRes();
		sendPropertyMarkdown(fakeReq('/property/tx/austin', { bed: '3_' }), res, {
			geo: { type: 'city', city: 'austin', state: 'tx' },
			articleComponent: { data: [article] },
			articleTotalCount: 120,
		});
		assert.equal(res.headers['Content-Type'], 'text/markdown; charset=utf-8');
		assert.match(res.body, /^# Homes for sale in Austin, TX\n/);
		assert.match(res.body, /120 homes match \(bed=3_\)/);
		assert.match(res.body, /1\. \[1 Main St, Austin, TX 78701\]\(\S*\/property\/detail\/tx\/78701\/abc-123\)/);
		assert.match(res.body, /\$450,000 · 3 bd · 2 ba · 1,850 sqft · Active · Open house · Price down \$10K/);
		assert.match(res.body, /\/property\/detail\/tx\/78701\/abc-123\.md\)/);
		assert.match(res.body, /Next page: \S*\/property\/tx\/austin\.md\?bed=3_&index=2/);
	});

	test('404 for an unknown place or listing', () => {
		const place = fakeRes();
		sendPropertyMarkdown(fakeReq('/property/zz/nowhere'), place, {});
		assert.equal(place.statusCode, 404);
		const listing = fakeRes();
		sendPropertyMarkdown(fakeReq('/property/detail/tx/78701/x', { prId: 'x' }), listing, { detail: null });
		assert.equal(listing.statusCode, 404);
		assert.match(listing.body, /^# Listing not found/);
	});
});

describe('sendSchoolsMarkdown', () => {
	test('groups by level, best rated first, with zone searches in the school city', () => {
		const res = fakeRes();
		const school = (id, name, rating, levels, city = 'round-rock') => ({
			id, name, rating, levels, type: 'public', grades: 'K-5', homes: 2, city: { city, state: 'tx' },
		});
		sendSchoolsMarkdown(fakeReq('/property/tx/round-rock/schools.md'), res, { state: 'tx', city: 'round rock', type: 'city' }, {
			sampled: 100,
			total: 963,
			schools: [
				school('4809136', 'Cactus Ranch Elementary School', 10, ['elementary']),
				school('4802920', 'Carver Elementary School', 5, ['elementary'], 'georgetown'),
				school('4805876', 'C D Fulkes Middle School', 3, ['middle']),
			],
		});
		assert.match(res.body, /^# Schools for homes in Round Rock, TX\n/);
		assert.match(res.body, /## Elementary schools\n\n1\. \[Cactus Ranch Elementary School\]\(\S*\/property\/tx\/round-rock\/4809136_school\) — rating 10\/10/);
		assert.match(res.body, /\/property\/tx\/georgetown\/4802920_school\)/);
		assert.match(res.body, /## Middle schools\n\n1\. \[C D Fulkes Middle School\]/);
		assert.doesNotMatch(res.body, /## High schools/);
	});
});

describe('sendSitemapMarkdown', () => {
	test('city entries link their homes web page first, then md, schools and browse', () => {
		const res = fakeRes();
		sendSitemapMarkdown(fakeReq('/property/sitemap/tx/williamson_county'), res, {
			title: 'Williamson County Cities',
			linksComponent: { data: [{ href: 'https://llmwikil.com/property/sitemap/tx/round-rock', text: 'Round Rock' }] },
		});
		assert.match(res.body, /^# Williamson County Cities\n/);
		assert.match(res.body, /- \[Round Rock\]\(\S*\/property\/tx\/round-rock\) \(\[md\]\(\S*\/property\/tx\/round-rock\.md\)\) · schools: \S*\/property\/tx\/round-rock\/schools\.md/);
	});
});
