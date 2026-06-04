import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createEjsRenderContext } from '../ejsRenderContext.js';
import { getHref, getSrc } from '../url.js';

describe('createEjsRenderContext', () => {
	test('binds getHref and getSrc from appHost and cdnHost', () => {
		const ctx = createEjsRenderContext({
			appHost: 'https://app.example.com',
			cdnHost: 'https://cdn.example.com',
		});
		assert.equal(ctx.getHref({ path: '/demo/tx' }), 'https://app.example.com/demo/tx');
		assert.equal(
			ctx.getSrc({ path: '/welcome.webp' }),
			'https://cdn.example.com/images/welcome.webp',
		);
	});

	test('reads hosts from meta when top-level fields absent', () => {
		const ctx = createEjsRenderContext({
			meta: { appHost: 'https://a.test', cdnHost: 'https://c.test' },
		});
		assert.equal(ctx.appHost, 'https://a.test');
		assert.equal(ctx.cdnHost, 'https://c.test');
	});

	test('getHref/getSrc match direct helpers', () => {
		const model = { appHost: 'https://app.test', cdnHost: 'https://cdn.test' };
		const ctx = createEjsRenderContext(model);
		const item = { path: '/x', id: '1' };
		const img = { path: '/y.png' };
		assert.equal(ctx.getHref(item), getHref(item, model.appHost));
		assert.equal(ctx.getSrc(img), getSrc(img, model.cdnHost));
	});
});
