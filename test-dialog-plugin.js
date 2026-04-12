/**
 * Contract test for dialog plugin (HTML dialog element; runs in Node; no browser DOM).
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import dialog from './client/js/plugins/_dialog.js';

test('dialog exports expected plugin shape', () => {
	assert.equal(dialog.name, 'dialog');
	assert.equal(typeof dialog.init, 'function');
	assert.equal(typeof dialog.initAfter, 'function');
	assert.ok(dialog.defaultOpt);
	assert.equal(dialog.defaultOpt.autoclose, true);
});
