/**
 * Unit tests for BaseController config/hook behavior.
 * Uses a synthetic config via TestBaseController (getConfig override) so production configs stay unchanged.
 */
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import BaseController from '../basecontroller.js';
import routeConfigs from '../../configs/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../../../dist');
const STATIC_UT_REL = '__basecontroller_ut__.html';
const STATIC_UT_ABS = path.join(DIST_DIR, STATIC_UT_REL);

/** @param {Record<string, unknown>} [overrides] */
function createMockReq(overrides = {}) {
	const base = {
		headers: {
			'user-agent': 'Mozilla/5.0 (test)',
			'accept-language': 'en-US,en;q=0.9',
			origin: 'http://localhost:3000',
			...overrides.headers,
		},
		query: { a: '1', b: '2' },
		body: { x: 10, y: 20 },
		path: '/test-contract',
		protocol: 'http',
		get: (/** @type {string} */ h) => (String(h).toLowerCase() === 'host' ? 'localhost:3000' : ''),
		acceptsLanguages: () => ['en-US'],
	};
	return { ...base, ...overrides };
}

function createMockRes() {
	/** @type {{ statusCode?: number, jsonBody?: unknown, sent?: string, renderCalls: Array<{ template: string, model: object }> }} */
	const state = { renderCalls: [] };
	return {
		state,
		status(code) {
			state.statusCode = code;
			return this;
		},
		json(body) {
			state.jsonBody = body;
		},
		send(html) {
			state.sent = html;
		},
		render(template, model, cb) {
			state.renderCalls.push({ template, model });
			if (typeof cb === 'function') {
				cb(null, '<html data-ut="1"></html>');
			}
		},
	};
}

/**
 * One synthetic config covering all BaseController-recognized hooks and branches.
 * @returns {Record<string, unknown>}
 */
function buildComprehensiveTestConfig() {
	return {
		name: 'test-contract',
		assetName: 'test-assets',
		beforeGet(req, payload) {
			assert.equal(payload.b, '2');
			return { ...payload, fromBeforeGet: true };
		},
		async get(payload) {
			assert.equal(payload.fromBeforeGet, true);
			return {
				meta: {
					title: 'T',
					preload: [{ as: 'image', href: '/page-hero.png' }],
				},
				theme: null,
				breadcrumb: { links: [{ text: 'Home', href: '/' }] },
				foo: 'bar',
			};
		},
		beforePost(req, payload) {
			return { ...payload, seenPost: true };
		},
		async post(payload) {
			assert.equal(payload.seenPost, true);
			return { ok: true };
		},
		beforeUpdate(req, payload) {
			return { ...payload, seenUpdate: true };
		},
		async update(payload) {
			assert.equal(payload.seenUpdate, true);
			return { updated: 1 };
		},
		beforeDelete(req, payload) {
			return { ...payload, seenDelete: true };
		},
		async delete(payload) {
			assert.equal(payload.seenDelete, true);
			return { deleted: true };
		},
		seo(req, model) {
			assert.ok(model?.data);
			return Promise.resolve({
				title: 'SEO Title',
				desc: 'SEO Desc',
				keywords: 'k1,k2',
			});
		},
		preload(req, model) {
			assert.ok(model?.data);
			return [{ as: 'image', href: '/extra.png' }];
		},
		onError(error, payload) {
			return {
				message: `handled:${error.message}`,
				data: { payloadSnapshot: payload },
				code: 418,
			};
		},
	};
}

class TestBaseController extends BaseController {
	/**
	 * @param {import('express').Request} req
	 * @param {import('express').Response} res
	 * @param {ReturnType<typeof buildComprehensiveTestConfig>} mockConfig
	 */
	constructor(req, res, mockConfig) {
		TestBaseController._mockConfig = mockConfig;
		super(req, res, mockConfig.name);
		TestBaseController._mockConfig = undefined;
	}

	getConfig(/** @type {string} */ _name) {
		const m = TestBaseController._mockConfig;
		if (m) return m;
		return super.getConfig(_name);
	}
}

afterEach(() => {
	try {
		if (fs.existsSync(STATIC_UT_ABS)) {
			fs.unlinkSync(STATIC_UT_ABS);
		}
	} catch {
		// ignore
	}
});

describe('BaseController + route config', () => {
	test('getConfig resolves real entries from configs/index.js', () => {
		const geo = routeConfigs.find((e) => e.name === 'geo');
		assert.ok(geo);
		assert.equal(typeof geo.get, 'function');
	});

	test('constructor throws when no matching config', () => {
		const req = createMockReq();
		const res = createMockRes();
		assert.throws(
			() => new BaseController(req, res, '__route_that_does_not_exist__'),
			/Model Config is required/,
		);
	});

	test('get uses beforeGet then get; success returns code 200', async () => {
		const cfg = buildComprehensiveTestConfig();
		const c = new TestBaseController(createMockReq(), createMockRes(), cfg);
		const out = await c.get();
		assert.equal(out?.code, 200);
		assert.equal(out?.data?.foo, 'bar');
	});

	test('get error uses onError mapping', async () => {
		const cfg = {
			name: 'err-get',
			beforeGet: () => ({ x: 1 }),
			get: async () => {
				throw new Error('boom');
			},
			onError: (err, payload) => ({
				message: `e:${err.message}`,
				data: payload,
				code: 400,
			}),
		};
		const c = new TestBaseController(createMockReq(), createMockRes(), cfg);
		const out = await c.get();
		assert.equal(out.code, 400);
		assert.equal(out.error, 'e:boom');
		assert.deepEqual(out.data, { x: 1 });
	});

	test('get error without onError falls back to defaults', async () => {
		const cfg = {
			name: 'err-get-raw',
			get: async () => {
				throw new Error('raw');
			},
		};
		const c = new TestBaseController(createMockReq(), createMockRes(), cfg);
		const out = await c.get();
		assert.equal(out.code, 500);
		assert.equal(out.error, 'raw');
		assert.equal(out.data, null);
	});

	test('post/update/delete use before* and return 200 on success', async () => {
		const cfg = buildComprehensiveTestConfig();
		const c = new TestBaseController(createMockReq(), createMockRes(), cfg);
		assert.deepEqual(await c.post(), { code: 200, data: { ok: true } });
		assert.deepEqual(await c.update(), { code: 200, data: { updated: 1 } });
		assert.deepEqual(await c.delete(), { code: 200, data: { deleted: true } });
	});

	test('post without beforePost passes req.body', async () => {
		const cfg = {
			name: 'post-plain',
			post: async (payload) => payload,
		};
		const c = new TestBaseController(createMockReq(), createMockRes(), cfg);
		const out = await c.post();
		assert.equal(out.code, 200);
		assert.equal(out.data.x, 10);
	});

	test('CRUD methods return undefined when handler missing', async () => {
		const cfg = { name: 'minimal', get: async () => ({}) };
		const c = new TestBaseController(createMockReq(), createMockRes(), cfg);
		assert.equal(await c.post(), undefined);
		assert.equal(await c.update(), undefined);
		assert.equal(await c.delete(), undefined);
	});

	test('toData injects meta and sends JSON envelope', async () => {
		const cfg = buildComprehensiveTestConfig();
		const res = createMockRes();
		const c = new TestBaseController(createMockReq(), res, cfg);
		const model = {
			code: 201,
			data: { hello: 1 },
			error: null,
		};
		await c.toData(model);
		assert.equal(res.state.statusCode, 201);
		assert.equal(res.state.jsonBody.code, 201);
		assert.equal(res.state.jsonBody.data.hello, 1);
		assert.ok(res.state.jsonBody.data.meta);
		assert.equal(res.state.jsonBody.data.meta.role, 'test-assets');
		assert.ok(Array.isArray(res.state.jsonBody.data.meta.preload));
		assert.ok(res.state.jsonBody.cost >= 0);
	});

	test('initialMeta uses model.data.meta.preload and appends config.preload', async () => {
		const cfg = buildComprehensiveTestConfig();
		const c = new TestBaseController(createMockReq(), createMockRes(), cfg);
		const model = {
			data: {
				meta: {
					preload: [{ as: 'font', href: '/f.woff2' }],
				},
			},
		};
		const meta = c.initialMeta(model);
		const hrefs = meta.preload.map((p) => p.href);
		assert.ok(hrefs.some((h) => String(h).includes('f.woff2')));
		assert.ok(hrefs.some((h) => String(h).includes('extra.png')));
	});

	test('initialBreadcrumb prefers model.data.breadcrumb over geo', async () => {
		const cfg = { name: 'bc', get: async () => ({}) };
		const c = new TestBaseController(
			createMockReq(),
			createMockRes(),
			cfg,
		);
		const explicit = { links: [{ text: 'X', href: '/x' }] };
		assert.deepEqual(
			c.initialBreadcrumb({ data: { breadcrumb: explicit, geo: { state: 'CA' } } }),
			explicit,
		);
	});

	test('initialBreadcrumb falls back to geo when no breadcrumb', async () => {
		const cfg = { name: 'demo', get: async () => ({}) };
		const c = new TestBaseController(createMockReq(), createMockRes(), cfg);
		const bc = c.initialBreadcrumb({
			data: { geo: { state: 'TX' } },
		});
		assert.ok(bc?.links);
		assert.ok(bc.links.length >= 1);
	});

	test('initialSeo returns defaults when seo hook absent', async () => {
		const cfg = { name: 'noseo', get: async () => ({}) };
		const c = new TestBaseController(createMockReq(), createMockRes(), cfg);
		const seo = await c.initialSeo({ data: {} });
		assert.deepEqual(seo, { title: '', desc: '', keywords: '' });
	});

	test('toPage throws when config.name is falsy', async () => {
		const cfg = { name: '', get: async () => ({}) };
		const c = new TestBaseController(createMockReq(), createMockRes(), cfg);
		await assert.rejects(() => c.toPage({ data: {} }), /View Template is required/);
	});

	test('toPage sets meta, async seo, helpers, render template, and saves static html', async () => {
		const cfg = buildComprehensiveTestConfig();
		const req = createMockReq({ path: '/__basecontroller_ut__' });
		const res = createMockRes();
		const c = new TestBaseController(req, res, cfg);
		const model = { data: { sections: [] } };
		await c.toPage(model);

		assert.equal(res.state.renderCalls.length, 1);
		assert.equal(res.state.renderCalls[0].template, 'test-contract.ejs');
		assert.equal(model.seo.title, 'SEO Title');
		assert.ok(typeof model.getHref === 'function');
		assert.ok(typeof model.getSrc === 'function');
		assert.ok(model.meta.inlineCss === undefined || typeof model.meta.inlineCss === 'string');
		assert.equal(res.state.sent?.includes('html'), true);
		assert.ok(fs.existsSync(STATIC_UT_ABS), 'static HTML should be written under dist/');
	});
});
