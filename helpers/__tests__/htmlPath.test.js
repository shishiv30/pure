import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
	appBaseFromPublicPath,
	pathnameFromHostUrl,
	prefixRootRelativeUrls,
	stripAppBase,
	withAppBase,
} from '../htmlPath.js';

describe('htmlPath', () => {
	test('pathnameFromHostUrl extracts /pure from GitHub Pages CDN URL', () => {
		assert.equal(pathnameFromHostUrl('https://shishiv30.github.io/pure'), '/pure');
		assert.equal(pathnameFromHostUrl('https://shishiv30.github.io/pure/'), '/pure');
		assert.equal(pathnameFromHostUrl('https://cdn.example.com'), '');
		assert.equal(pathnameFromHostUrl('/not-a-url'), '');
	});

	test('appBaseFromPublicPath reads the deploy folder from publicPath', () => {
		assert.equal(appBaseFromPublicPath('https://shishiv30.github.io/pure/'), '/pure');
		assert.equal(appBaseFromPublicPath('https://shishiv30.github.io/subdomain/'), '/subdomain');
		assert.equal(appBaseFromPublicPath('/'), '');
		assert.equal(appBaseFromPublicPath('https://cdn.example.com/'), '');
	});

	test('stripAppBase and withAppBase round-trip a deploy prefix', () => {
		assert.equal(stripAppBase('/pure/demo/tx/houston', '/pure'), '/demo/tx/houston');
		assert.equal(stripAppBase('/subdomain/demo/detail/tx/a/b', '/subdomain'), '/demo/detail/tx/a/b');
		assert.equal(stripAppBase('/demo/tx', '/pure'), '/demo/tx');
		assert.equal(stripAppBase('/purely/demo', '/pure'), '/purely/demo');
		assert.equal(withAppBase('/demo/tx', '/pure'), '/pure/demo/tx');
		assert.equal(withAppBase('/pure/demo/tx', '/pure'), '/pure/demo/tx');
	});

	test('prefixRootRelativeUrls adds base path to root-relative href/src', () => {
		const html =
			'<a href="/demo/tx">x</a><img src="/images/a.png"><a href="./local.html">y</a>';
		const out = prefixRootRelativeUrls(html, '/pure');
		assert.match(out, /href="\/pure\/demo\/tx"/);
		assert.match(out, /src="\/pure\/images\/a\.png"/);
		assert.match(out, /href="\.\/local\.html"/);
	});
});
