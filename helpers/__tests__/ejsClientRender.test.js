import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import ejs from 'ejs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createEjsRenderContext } from '../ejsRenderContext.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ejsRoot = path.resolve(__dirname, '../../server/ejs');

const STATIC_INCLUDE_RE = /<%-?\s*include\s*\(\s*['"]([^'"]+)['"]/g;

/**
 * @param {string} absPath
 * @param {Map<string, Function>} partials
 */
function buildPartials(absPath, partials) {
	const resolved = path.resolve(absPath);
	if (partials.has(resolved)) {
		return;
	}
	const key = path.basename(resolved, '.ejs');
	const source = fs.readFileSync(resolved, 'utf8');
	const compiled = ejs.compile(source, {
		client: true,
		compileDebug: false,
		filename: resolved,
	});
	// eslint-disable-next-line no-new-func
	partials.set(key, new Function(`return ${compiled.toString()}`)());
	let match;
	const re = new RegExp(STATIC_INCLUDE_RE.source, 'g');
	while ((match = re.exec(source)) !== null) {
		const partialPath = path.join(ejsRoot, `${match[1].replace(/\.ejs$/, '')}.ejs`);
		buildPartials(partialPath, partials);
	}
}

/**
 * @param {string} entryName — basename without .ejs
 * @param {object} templateLocals
 * @param {object} model
 * @returns {string}
 */
function renderEntry(entryName, templateLocals, model) {
	const entryPath = path.join(ejsRoot, `${entryName}.ejs`);
	/** @type {Map<string, Function>} */
	const partialFns = new Map();
	buildPartials(entryPath, partialFns);
	const partials = Object.fromEntries(partialFns.entries());

	function callPartial(key, locals, includeFn) {
		const fn = partials[key];
		if (!fn) {
			throw new Error(`Unknown partial: ${key}`);
		}
		return fn(locals, null, includeFn, (err) => {
			throw err;
		});
	}

	const ctx = createEjsRenderContext(model);
	Object.assign(ctx, templateLocals);

	function include(name, data) {
		const key = String(name).replace(/\.ejs$/i, '');
		const merged = Object.assign({}, ctx, data || {});
		merged.include = include;
		if (typeof ctx.getHref === 'function') {
			merged.getHref = ctx.getHref;
		}
		if (typeof ctx.getSrc === 'function') {
			merged.getSrc = ctx.getSrc;
		}
		return callPartial(key, merged, include);
	}

	ctx.include = include;
	return callPartial(entryName, ctx, include);
}

const detailFixture = {
	title: '123 Main St',
	tags: { items: [{ text: 'sale', className: 'major' }] },
	album: {
		images: ['https://cdn.example.com/a.jpg'],
		initialIndex: 0,
		alt: 'Front',
	},
	paragraph: { text: 'A nice home.' },
	record: {
		heading: 'Facts',
		items: [{ key: 'Bd', value: '3', desc: 'Bedrooms' }],
	},
	timeline: {
		heading: 'History',
		entries: [{ type: 'desc', date: '2020', text: 'Sold' }],
	},
};

describe('client EJS render (comp_article_detail)', () => {
	test('renders id=detail, slider, and list-dict', () => {
		const html = renderEntry(
			'comp_article_detail',
			{ detail: detailFixture },
			{ appHost: 'https://app.test', cdnHost: 'https://cdn.test' },
		);
		assert.match(html, /id="detail"/);
		assert.match(html, /data-role="slider"/);
		assert.match(html, /data-role="list-dict"/);
		assert.match(html, /123 Main St/);
	});
});
