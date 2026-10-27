/**
 * Live HTTP smoke for demo search. Requires a running server (npm run dev:server).
 * Writes reports/demo-search-latest.md after every run.
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getCityPath } from '../../../helpers/geo.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
const REPORT_DIR = path.join(ROOT, 'reports');
const FETCH_MS = 60000;

const BASE =
	process.env.DEMO_BASE_URL ||
	`http://localhost:${process.env.PORT || 4000}`;

const CITY_POOL = [
	getCityPath('Los Angeles', 'CA'),
	getCityPath('San Diego', 'CA'),
	getCityPath('Austin', 'TX'),
	getCityPath('Houston', 'TX'),
	getCityPath('Dallas', 'TX'),
	getCityPath('New York', 'NY'),
	getCityPath('Miami', 'FL'),
	getCityPath('Chicago', 'IL'),
	getCityPath('Seattle', 'WA'),
	getCityPath('Phoenix', 'AZ'),
];

const GEO_CASES = [
	{ name: 'geo: state ca', path: 'ca' },
	{ name: 'geo: city los-angeles', path: 'ca/los-angeles' },
	{ name: 'geo: county los-angeles', path: 'ca/los-angeles_county' },
	{ name: 'geo: zip 90013', path: 'ca/90013' },
	{ name: 'geo: neighborhood old-town', path: 'tx/round-rock/old-town_neighborhood' },
	{ name: 'geo: school austin', path: 'tx/austin/483808012358_school' },
	{ name: 'geo: city austin', path: 'tx/austin' },
	{ name: 'geo: county williamson', path: 'tx/williamson_county' },
	{ name: 'geo: zip 78664', path: 'tx/78664' },
];

const FILTER_QUERIES = [
	{ name: 'filter: price both', query: 'price=250000_1500000' },
	{ name: 'filter: price min', query: 'price=100000_' },
	{ name: 'filter: price max', query: 'price=_2000000' },
	{ name: 'filter: bed both', query: 'bed=2_4' },
	{ name: 'filter: bed min', query: 'bed=3_' },
	{ name: 'filter: bed max', query: 'bed=_3' },
	{ name: 'filter: bath min', query: 'bath=2_' },
	{ name: 'filter: bath max', query: 'bath=_2' },
	{ name: 'filter: type single_family', query: 'propertyType[]=single_family' },
	{ name: 'filter: type condo', query: 'propertyType[]=condo' },
	{ name: 'filter: type multi_family', query: 'propertyType[]=multi_family' },
	{ name: 'filter: type mobile', query: 'propertyType[]=mobile' },
	{ name: 'filter: type land', query: 'propertyType[]=land' },
	{ name: 'filter: type other', query: 'propertyType[]=other' },
	{
		name: 'filter: type multi-select',
		query: 'propertyType[]=single_family&propertyType[]=condo',
	},
	{ name: 'filter: for sale default', query: '' },
	{ name: 'filter: sold', query: 'propertyStatus[]=sold' },
	{ name: 'filter: rental', query: 'propertyStatus[]=rental' },
	{ name: 'filter: photo', query: 'photo=true' },
	{ name: 'filter: construction', query: 'construction=true' },
	{ name: 'filter: openhouse', query: 'openhouse=true' },
	{
		name: 'filter: price+bed+type',
		query: 'price=250000_1500000&bed=2_4&propertyType[]=single_family',
	},
	{ name: 'filter: photo+construction', query: 'photo=true&construction=true' },
	{
		name: 'filter: sold+condo',
		query: 'propertyStatus[]=sold&propertyType[]=condo',
	},
	{ name: 'filter: rental+beds', query: 'propertyStatus[]=rental&bed=1_3' },
	{
		name: 'filter: openhouse+type',
		query: 'openhouse=true&propertyType[]=single_family',
	},
];

const HTML_FILTERS = [
	{ name: 'html filter: price', query: 'price=250000_1500000' },
	{ name: 'html filter: type', query: 'propertyType[]=single_family' },
	{ name: 'html filter: sold', query: 'propertyStatus[]=sold' },
	{ name: 'html filter: openhouse', query: 'openhouse=true' },
	{ name: 'html filter: size+index', query: 'size=5&index=2' },
];

/** @type {Array<Record<string, unknown>>} */
const rows = [];
const startedAt = new Date();
let cityPath = '';
let serverOk = false;

function shuffle(list) {
	const copy = [...list];
	for (let i = copy.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy;
}

function searchUrl(geoPath, query = '') {
	const q = query ? `?${query}` : '';
	return `${BASE}/api/property/search/${geoPath}${q}`;
}

function htmlUrl(geoPath, query = '') {
	const q = query ? `?${query}` : '';
	return `${BASE}/property/${geoPath}${q}`;
}

function curlFor(url, follow = false) {
	const flag = follow ? '-L ' : '';
	return `curl -sS ${flag}-D - -o /tmp/demo-search-body -w '%{http_code}' '${url}'`;
}

function snippet(text) {
	if (!text) {
		return '';
	}
	return String(text).slice(0, 500);
}

function articleId(article) {
	return article?.path || article?.metadata?.propertyId || '';
}

function articlePrice(article) {
	const price = article?.metadata?.price;
	if (typeof price === 'number' && Number.isFinite(price)) {
		return price;
	}
	const est = Array.isArray(article?.attrs)
		? article.attrs.find((row) => row?.key === 'Est')
		: null;
	if (!est?.value) {
		return null;
	}
	const n = Number(String(est.value).replace(/[^0-9.]/g, ''));
	return Number.isFinite(n) ? n : null;
}

function isSorted(values, dir) {
	const nums = values.filter((n) => typeof n === 'number');
	if (nums.length < 2) {
		return nums.length > 0;
	}
	for (let i = 1; i < nums.length; i += 1) {
		if (dir === 'asc' && nums[i] < nums[i - 1]) {
			return false;
		}
		if (dir === 'desc' && nums[i] > nums[i - 1]) {
			return false;
		}
	}
	return true;
}

async function request(url, { follow = true } = {}) {
	const res = await fetch(url, {
		redirect: follow ? 'follow' : 'manual',
		signal: AbortSignal.timeout(FETCH_MS),
	});
	const body = await res.text();
	return { status: res.status, body, location: res.headers.get('location') };
}

function parseJson(body) {
	try {
		return JSON.parse(body);
	} catch {
		return null;
	}
}

function record(row) {
	rows.push(row);
}

async function runCase(spec) {
	const { name, url, expect, follow = true } = spec;
	const curl = curlFor(url, follow);
	try {
		const res = await request(url, { follow });
		await expect(res);
		record({
			name,
			status: 'PASS',
			url,
			curl,
			http: res.status,
			error: '',
			stack: '',
			snippet: '',
		});
	} catch (err) {
		const error = err instanceof Error ? err : new Error(String(err));
		record({
			name,
			status: 'FAIL',
			url,
			curl,
			http: error.http || '',
			error: error.message,
			stack: error.stack || '',
			snippet: error.snippet || '',
		});
	}
}

function failExpect(res, message) {
	const err = new Error(message);
	err.http = res.status;
	err.snippet = snippet(res.body);
	throw err;
}

function assertSearchOk(res, extra) {
	if (res.status !== 200) {
		failExpect(res, `HTTP ${res.status}`);
	}
	const data = parseJson(res.body);
	if (!data || typeof data !== 'object') {
		failExpect(res, 'Response is not JSON');
	}
	if (!Array.isArray(data.articles)) {
		failExpect(res, 'articles is not an array');
	}
	if (typeof data.totalCount !== 'number') {
		failExpect(res, `totalCount is ${data.totalCount}`);
	}
	if (extra) {
		extra(data, res);
	}
	return data;
}

function assertListings(res, extra) {
	return assertSearchOk(res, (data, inner) => {
		if (data.articles.length === 0 || !(data.totalCount > 0)) {
			failExpect(inner, 'Empty articles');
		}
		if (extra) {
			extra(data, inner);
		}
	});
}

function assertHtmlOk(res) {
	if (res.status !== 200) {
		failExpect(res, `HTTP ${res.status}`);
	}
}

function writeReport() {
	fs.mkdirSync(REPORT_DIR, { recursive: true });
	const endedAt = new Date();
	const passed = rows.filter((r) => r.status === 'PASS').length;
	const failed = rows.filter((r) => r.status === 'FAIL').length;
	const skipped = rows.filter((r) => r.status === 'SKIP').length;
	const lines = [
		'# Demo search live report',
		'',
		`- Base URL: ${BASE}`,
		`- City path: ${cityPath || '(none)'}`,
		`- Started: ${startedAt.toISOString()}`,
		`- Ended: ${endedAt.toISOString()}`,
		`- Duration ms: ${endedAt.getTime() - startedAt.getTime()}`,
		`- Passed: ${passed}`,
		`- Failed: ${failed}`,
		`- Skipped: ${skipped}`,
		`- Total: ${rows.length}`,
		'',
		'| status | name | http | error |',
		'|---|---|---|---|',
	];
	for (const row of rows) {
		const err = String(row.error || '').replace(/\|/g, '\\|').slice(0, 120);
		lines.push(`| ${row.status} | ${row.name} | ${row.http || ''} | ${err} |`);
	}
	const details = rows.filter((r) => r.status !== 'PASS');
	if (details.length) {
		lines.push('', '## Failures and skips');
		for (const row of details) {
			lines.push(`### ${row.name} (${row.status})`);
			lines.push('');
			lines.push(`- URL: ${row.url || ''}`);
			lines.push(`- HTTP: ${row.http || '(no response)'}`);
			lines.push(`- Error: ${row.error || ''}`);
			lines.push('');
			if (row.curl) {
				lines.push('```');
				lines.push(row.curl);
				lines.push('```');
				lines.push('');
			}
			if (row.stack) {
				lines.push('```');
				lines.push(row.stack);
				lines.push('```');
				lines.push('');
			}
			if (row.snippet) {
				lines.push('Body snippet:');
				lines.push('');
				lines.push('```');
				lines.push(row.snippet);
				lines.push('```');
				lines.push('');
			}
		}
	}
	const markdown = `${lines.join('\n')}\n`;
	const stamp = endedAt.toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
	const latestMd = path.join(REPORT_DIR, 'demo-search-latest.md');
	const stampMd = path.join(REPORT_DIR, `demo-search-${stamp}.md`);
	const latestJson = path.join(REPORT_DIR, 'demo-search-latest.json');
	fs.writeFileSync(latestMd, markdown);
	fs.writeFileSync(stampMd, markdown);
	fs.writeFileSync(
		latestJson,
		`${JSON.stringify(
			{
				base: BASE,
				cityPath,
				startedAt: startedAt.toISOString(),
				endedAt: endedAt.toISOString(),
				passed,
				failed,
				skipped,
				total: rows.length,
				rows,
			},
			null,
			'\t',
		)}\n`,
	);
	console.log(`Demo search report: ${latestMd}`);
	return { passed, failed, skipped, latestMd };
}

describe('demo search live', { timeout: 1200000 }, () => {
	before(async () => {
		try {
			const res = await request(`${BASE}/property/sitemap`);
			serverOk = res.status === 200;
		} catch (err) {
			serverOk = false;
			record({
				name: 'probe: /property/sitemap',
				status: 'SKIP',
				url: `${BASE}/property/sitemap`,
				curl: curlFor(`${BASE}/property/sitemap`),
				http: '',
				error: `Server not reachable. Start npm run dev:server. ${err.message}`,
				stack: err.stack || '',
				snippet: '',
			});
		}
		if (!serverOk) {
			return;
		}
		const pinned = process.env.DEMO_SEARCH_CITY;
		const order = pinned
			? [pinned, ...CITY_POOL.filter((p) => p !== pinned)]
			: shuffle(CITY_POOL);
		for (const candidate of order.slice(0, 5)) {
			try {
				const res = await request(searchUrl(candidate));
				const data = parseJson(res.body);
				if (
					res.status === 200 &&
					Array.isArray(data?.articles) &&
					data.articles.length > 0 &&
					data.totalCount > 0
				) {
					cityPath = candidate;
					break;
				}
			} catch {
				// try next city
			}
		}
	});

	after(() => {
		const summary = writeReport();
		if (!serverOk) {
			return;
		}
		assert.equal(summary.failed, 0, `${summary.failed} live search case(s) failed`);
	});

	test('classic geo paths return listings', async (t) => {
		if (!serverOk) {
			t.skip('server not running');
			return;
		}
		for (const geo of GEO_CASES) {
			await runCase({
				name: `${geo.name} json`,
				url: searchUrl(geo.path),
				expect: (res) => assertListings(res),
			});
			await runCase({
				name: `${geo.name} html`,
				url: htmlUrl(geo.path),
				expect: (res) => assertHtmlOk(res),
			});
		}
		await runCase({
			name: 'geo: redirect los-angeles-ca',
			url: htmlUrl('los-angeles-ca'),
			follow: false,
			expect: (res) => {
				if (res.status !== 301) {
					failExpect(res, `expected 301, got ${res.status}`);
				}
				const loc = res.location || '';
				if (!loc.includes('/property/ca/los-angeles')) {
					failExpect(res, `unexpected Location: ${loc}`);
				}
			},
		});
		await runCase({
			name: 'geo: address optional listings',
			url: searchUrl('ca/los-angeles/460-s-spring-st_address'),
			expect: (res) => {
				if (res.status !== 200) {
					failExpect(res, `HTTP ${res.status}`);
				}
			},
		});
		await runCase({
			name: 'geo: map coords html',
			url: htmlUrl('ca/los-angeles/@34.05,-118.24'),
			expect: (res) => assertHtmlOk(res),
		});
	});

	test('filter matrix on random city', async (t) => {
		if (!serverOk) {
			t.skip('server not running');
			return;
		}
		if (!cityPath) {
			record({
				name: 'filter matrix city pick',
				status: 'SKIP',
				url: '',
				curl: '',
				http: '',
				error: 'No city in the pool returned listings',
				stack: '',
				snippet: '',
			});
			t.skip('no city inventory');
			return;
		}
		for (const row of FILTER_QUERIES) {
			await runCase({
				name: `${row.name} (${cityPath})`,
				url: searchUrl(cityPath, row.query),
				expect: (res) => assertSearchOk(res),
			});
		}
		for (const row of HTML_FILTERS) {
			await runCase({
				name: `${row.name} (${cityPath})`,
				url: htmlUrl(cityPath, row.query),
				expect: (res) => assertHtmlOk(res),
			});
		}
	});

	test('pagination size and index', async (t) => {
		if (!serverOk || !cityPath) {
			t.skip('server or city unavailable');
			return;
		}
		let pageSize5;
		let pageSize10;
		let page1;
		let page2;
		let page3;
		await runCase({
			name: `page: default (${cityPath})`,
			url: searchUrl(cityPath),
			expect: (res) => assertListings(res),
		});
		await runCase({
			name: `page: size=5 (${cityPath})`,
			url: searchUrl(cityPath, 'size=5'),
			expect: (res) => {
				pageSize5 = assertListings(res, (data) => {
					if (data.articles.length > 5) {
						failExpect(res, `expected <=5 articles, got ${data.articles.length}`);
					}
				});
			},
		});
		await runCase({
			name: `page: size=10 (${cityPath})`,
			url: searchUrl(cityPath, 'size=10'),
			expect: (res) => {
				pageSize10 = assertListings(res, (data) => {
					if (data.articles.length > 10) {
						failExpect(res, `expected <=10 articles, got ${data.articles.length}`);
					}
				});
			},
		});
		if (pageSize5 && pageSize10 && pageSize10.articles.length <= pageSize5.articles.length) {
			record({
				name: `page: size=10 has more than size=5 (${cityPath})`,
				status: 'FAIL',
				url: searchUrl(cityPath, 'size=10'),
				curl: curlFor(searchUrl(cityPath, 'size=10')),
				http: 200,
				error: 'size=10 did not return more cards than size=5',
				stack: '',
				snippet: '',
			});
		} else if (pageSize5 && pageSize10) {
			record({
				name: `page: size=10 has more than size=5 (${cityPath})`,
				status: 'PASS',
				url: searchUrl(cityPath, 'size=10'),
				curl: curlFor(searchUrl(cityPath, 'size=10')),
				http: 200,
				error: '',
				stack: '',
				snippet: '',
			});
		}
		await runCase({
			name: `page: size=10&index=1 (${cityPath})`,
			url: searchUrl(cityPath, 'size=10&index=1'),
			expect: (res) => {
				page1 = assertListings(res);
			},
		});
		await runCase({
			name: `page: size=10&index=2 (${cityPath})`,
			url: searchUrl(cityPath, 'size=10&index=2'),
			expect: (res) => {
				page2 = assertListings(res, (data) => {
					if (page1 && data.totalCount !== page1.totalCount) {
						failExpect(
							res,
							`totalCount mismatch page1 ${page1.totalCount} vs page2 ${data.totalCount}`,
						);
					}
				});
			},
		});
		if (page1 && page2) {
			const ids1 = new Set(page1.articles.map(articleId).filter(Boolean));
			const overlap = page2.articles.map(articleId).filter((id) => ids1.has(id));
			const name = `page: index 1 vs 2 disjoint (${cityPath})`;
			if (overlap.length) {
				record({
					name,
					status: 'FAIL',
					url: searchUrl(cityPath, 'size=10&index=2'),
					curl: curlFor(searchUrl(cityPath, 'size=10&index=2')),
					http: 200,
					error: `overlapping ids: ${overlap.slice(0, 5).join(', ')}`,
					stack: '',
					snippet: '',
				});
			} else {
				record({
					name,
					status: 'PASS',
					url: searchUrl(cityPath, 'size=10&index=2'),
					curl: curlFor(searchUrl(cityPath, 'size=10&index=2')),
					http: 200,
					error: '',
					stack: '',
					snippet: '',
				});
			}
		}
		await runCase({
			name: `page: size=5&index=3 (${cityPath})`,
			url: searchUrl(cityPath, 'size=5&index=3'),
			expect: (res) => {
				page3 = assertListings(res, (data) => {
					if (data.articles.length > 5) {
						failExpect(res, `expected <=5 articles, got ${data.articles.length}`);
					}
				});
			},
		});
		if (page3 && pageSize5) {
			const idsA = new Set(pageSize5.articles.map(articleId).filter(Boolean));
			const overlap = page3.articles.map(articleId).filter((id) => idsA.has(id));
			const name = `page: size=5 index 1 vs 3 disjoint (${cityPath})`;
			record({
				name,
				status: overlap.length ? 'FAIL' : 'PASS',
				url: searchUrl(cityPath, 'size=5&index=3'),
				curl: curlFor(searchUrl(cityPath, 'size=5&index=3')),
				http: 200,
				error: overlap.length
					? `overlapping ids: ${overlap.slice(0, 5).join(', ')}`
					: '',
				stack: '',
				snippet: '',
			});
		}
		await runCase({
			name: `page: size+type (${cityPath})`,
			url: searchUrl(cityPath, 'size=5&index=2&propertyType[]=single_family'),
			expect: (res) =>
				assertSearchOk(res, (data) => {
					if (data.articles.length > 5) {
						failExpect(res, `expected <=5 articles, got ${data.articles.length}`);
					}
				}),
		});
	});

	test('sort and order', async (t) => {
		if (!serverOk || !cityPath) {
			t.skip('server or city unavailable');
			return;
		}
		let asc;
		await runCase({
			name: `sort: price asc (${cityPath})`,
			url: searchUrl(cityPath, 'sort=price&order=asc&size=10'),
			expect: (res) => {
				asc = assertListings(res, (data) => {
					const prices = data.articles.map(articlePrice);
					if (!isSorted(prices, 'asc')) {
						failExpect(res, `prices not non-decreasing: ${prices.join(',')}`);
					}
				});
			},
		});
		await runCase({
			name: `sort: price desc (${cityPath})`,
			url: searchUrl(cityPath, 'sort=price&order=desc&size=10'),
			expect: (res) => {
				assertListings(res, (data) => {
					const prices = data.articles.map(articlePrice);
					if (!isSorted(prices, 'desc')) {
						failExpect(res, `prices not non-increasing: ${prices.join(',')}`);
					}
					const firstDesc = prices.find((n) => typeof n === 'number');
					const ascPrices = asc?.articles.map(articlePrice) || [];
					const firstAsc = ascPrices.find((n) => typeof n === 'number');
					if (
						typeof firstDesc === 'number' &&
						typeof firstAsc === 'number' &&
						firstDesc < firstAsc
					) {
						failExpect(res, `desc first ${firstDesc} < asc first ${firstAsc}`);
					}
				});
			},
		});
		await runCase({
			name: `sort: list_date desc (${cityPath})`,
			url: searchUrl(cityPath, 'sort=list_date&order=desc&size=10'),
			expect: (res) => assertListings(res),
		});
		await runCase({
			name: `sort: price asc page 2 (${cityPath})`,
			url: searchUrl(cityPath, 'sort=price&order=asc&size=5&index=2'),
			expect: (res) =>
				assertListings(res, (data) => {
					if (data.articles.length > 5) {
						failExpect(res, `expected <=5 articles, got ${data.articles.length}`);
					}
					const prices = data.articles.map(articlePrice);
					if (!isSorted(prices, 'asc')) {
						failExpect(res, `prices not non-decreasing: ${prices.join(',')}`);
					}
				}),
		});
		await runCase({
			name: `sort: price desc condo (${cityPath})`,
			url: searchUrl(cityPath, 'sort=price&order=desc&propertyType[]=condo&size=10'),
			expect: (res) =>
				assertSearchOk(res, (data) => {
					if (!data.articles.length) {
						return;
					}
					const prices = data.articles.map(articlePrice);
					if (!isSorted(prices, 'desc')) {
						failExpect(res, `prices not non-increasing: ${prices.join(',')}`);
					}
				}),
		});
	});
});
