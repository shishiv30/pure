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
		assert.equal(stripAppBase('/pure/property/tx/houston', '/pure'), '/property/tx/houston');
		assert.equal(stripAppBase('/subdomain/property/detail/tx/a/b', '/subdomain'), '/property/detail/tx/a/b');
		assert.equal(stripAppBase('/property/tx', '/pure'), '/property/tx');
		assert.equal(stripAppBase('/purely/demo', '/pure'), '/purely/demo');
		assert.equal(withAppBase('/property/tx', '/pure'), '/pure/property/tx');
		assert.equal(withAppBase('/pure/property/tx', '/pure'), '/pure/property/tx');
	});

	test('prefixRootRelativeUrls adds base path to root-relative href/src', () => {
		const html =
			'<a href="/property/tx">x</a><img src="/images/a.png"><a href="./local.html">y</a>';
		const out = prefixRootRelativeUrls(html, '/pure');
		assert.match(out, /href="\/pure\/property\/tx"/);
		assert.match(out, /src="\/pure\/images\/a\.png"/);
		assert.match(out, /href="\.\/local\.html"/);
	});
});
