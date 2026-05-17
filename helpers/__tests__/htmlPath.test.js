import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { pathnameFromHostUrl, prefixRootRelativeUrls } from '../htmlPath.js';

describe('htmlPath', () => {
	test('pathnameFromHostUrl extracts /pure from GitHub Pages CDN URL', () => {
		assert.equal(pathnameFromHostUrl('https://shishiv30.github.io/pure'), '/pure');
		assert.equal(pathnameFromHostUrl('https://shishiv30.github.io/pure/'), '/pure');
		assert.equal(pathnameFromHostUrl('https://cdn.example.com'), '');
		assert.equal(pathnameFromHostUrl('/not-a-url'), '');
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
