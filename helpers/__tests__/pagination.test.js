import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getPagination, pageWindow, searchWithPage } from '../pagination.js';

describe('pageWindow', () => {
	test('first, last and neighbours with gaps', () => {
		assert.deepEqual(pageWindow(7, 20), [1, null, 6, 7, 8, null, 20]);
		assert.deepEqual(pageWindow(1, 20), [1, 2, null, 20]);
		assert.deepEqual(pageWindow(20, 20), [1, null, 19, 20]);
	});
	test('a one-page gap shows the page instead of …', () => {
		assert.deepEqual(pageWindow(4, 20), [1, 2, 3, 4, 5, null, 20]);
		assert.deepEqual(pageWindow(2, 3), [1, 2, 3]);
	});
});

describe('searchWithPage', () => {
	test('sets index, keeps other params, drops index for page 1', () => {
		assert.equal(searchWithPage('?bed=3_&index=4', 5), '?bed=3_&index=5');
		assert.equal(searchWithPage('?bed=3_&index=4', 1), '?bed=3_');
		assert.equal(searchWithPage('', 1), '');
		assert.equal(searchWithPage('sort=value', 2), '?sort=value&index=2');
	});
});

describe('getPagination', () => {
	test('null when one page or none', () => {
		assert.equal(getPagination({ total: 50, path: '/p' }), null);
		assert.equal(getPagination({ total: 0, path: '/p' }), null);
	});
	test('range, prev/next and hrefs; default page size 50', () => {
		const p = getPagination({ total: 963, path: '/property/tx/round-rock', search: '?bed=3_&index=7', index: '7' });
		assert.equal(p.pages, 20);
		assert.equal(p.from, 301);
		assert.equal(p.to, 350);
		assert.equal(p.prev.href, '/property/tx/round-rock?bed=3_&index=6');
		assert.equal(p.next.href, '/property/tx/round-rock?bed=3_&index=8');
		assert.equal(p.items[0].href, '/property/tx/round-rock?bed=3_');
		assert.deepEqual(p.items[1], { gap: true });
		assert.equal(p.items.find((i) => i.current).page, 7);
	});
	test('last page clamps and has no next; custom size', () => {
		const p = getPagination({ total: 95, path: '/p', index: 9, size: 20 });
		assert.equal(p.current, 5);
		assert.equal(p.to, 95);
		assert.equal(p.next, null);
	});
});
