#!/usr/bin/env node
/**
 * Seed local CMS database from data files and sync to remote CMS.
 * Replaces server-side DB with local DB (pages, comps, sitemap).
 *
 * Usage: node cms/scripts/seed-and-sync.js [--local-only] [CMS_URL] [CMS_EMAIL] [CMS_PASSWORD]
 *   --local-only: seed local DB only, do not sync to remote
 *   CMS_URL: target CMS (default: from env or https://cms.conjeezou.com)
 *   With CMS_EMAIL/CMS_PASSWORD: seeds local DB, then syncs to remote via API
 *
 * Run from repo root.
 * Data sources: data/page/header.js (pagePath), data/page/*.js, data/theme.js
 */

import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, '..', '..');
try {
	const dotenv = (await import('dotenv')).default;
	dotenv.config({ path: path.join(repoRoot, '.env') });
	dotenv.config({ path: path.join(repoRoot, '.env.local') });
} catch {
	// dotenv optional
}

const args = process.argv.slice(2).filter((a) => a !== '--local-only');
const LOCAL_ONLY = process.argv.includes('--local-only');
const CMS_URL = (process.env.CMS_URL || args[0] || 'https://cms.conjeezou.com').replace(/\/$/, '');
let CMS_EMAIL = process.env.CMS_EMAIL || args[1];
let CMS_PASSWORD = process.env.CMS_PASSWORD || args[2];

const DB_PATH =
	process.env.DB_PATH || path.join(__dirname, '..', 'data', 'cms.db');
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_PAGE_PATH = { index: 'page/index', 'ai-trend': 'page/ai-trend' };

function prompt(question) {
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			rl.close();
			resolve(answer);
		});
	});
}

async function getCredentials() {
	if (!CMS_EMAIL) CMS_EMAIL = await prompt('CMS Email: ');
	if (!CMS_PASSWORD) {
		CMS_PASSWORD = await prompt('CMS Password: ');
		process.stdout.write('\x1B[1A\x1B[2K');
	}
}

let db;
let dbRun;
let dbAll;

function getCookie(res) {
	const setCookie = res.headers.get('set-cookie');
	if (!setCookie) return null;
	return setCookie.split(',')[0].split(';')[0].trim();
}

async function login() {
	const res = await fetch(`${CMS_URL}/api/auth/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email: CMS_EMAIL, password: CMS_PASSWORD }),
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(`Login failed: ${err.message || res.statusText}`);
	}
	const cookie = getCookie(res);
	if (!cookie) console.warn('Warning: No Set-Cookie in login response.');
	return cookie;
}

function apiHeaders(cookie) {
	const h = { 'Content-Type': 'application/json' };
	if (cookie) h.Cookie = cookie;
	return h;
}

// ---------- Seed local DB ----------
async function seedPages() {
	let pagePath;
	try {
		({ pagePath } = await import(path.join(REPO_ROOT, 'data/page/header.js')));
	} catch {
		pagePath = null;
	}
	const entries = Object.entries(pagePath || DEFAULT_PAGE_PATH);

	for (const [key, pathVal] of entries) {
		const modPath =
			key === 'index'
				? path.join(REPO_ROOT, 'data/page/index.js')
				: path.join(REPO_ROOT, `data/page/${key}.js`);
		let payload;
		try {
			payload = (await import(modPath)).default;
		} catch (err) {
			console.warn(`  Skip page ${key}: ${err.message}`);
			continue;
		}
		const meta =
			key === 'index'
				? { title: 'Pure Home', desc: 'Author: Conjee Zou', path: pathVal }
				: { path: pathVal };
		const dataJson = typeof payload === 'string' ? payload : JSON.stringify(payload);

		await dbRun(
			`INSERT INTO pages (name, path, data, type, format, meta, status, created_at, updated_at)
			 VALUES (?, ?, ?, 'page', 'json', ?, 'published', datetime('now'), datetime('now'))
			 ON CONFLICT(name) DO UPDATE SET
			   path = excluded.path, data = excluded.data,
			   format = excluded.format, meta = excluded.meta, status = excluded.status,
			   updated_at = datetime('now')`,
			[key, pathVal, dataJson, JSON.stringify(meta)]
		);
		console.log(`  ✓ Page: ${key}`);
	}
}

function ensureHeaderLinks(links, pagePathMap) {
	const arr = Array.isArray(links) ? [...links] : [];
	for (const [name, pathVal] of Object.entries(pagePathMap || {})) {
		const pagePathStr = `/page/${name}`;
		const idx = arr.findIndex((r) => r.path === pagePathStr || r.path === `${pagePathStr}/`);
		const text = name === 'index' ? 'Home' : name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
		const maxId = arr.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0);
		const maxOrder = arr.reduce((m, r) => Math.max(m, Number(r.order) ?? 0), 0);
		if (idx >= 0) {
			arr[idx] = { ...arr[idx], text, path: pagePathStr };
		} else {
			arr.push({
				id: maxId + 1,
				text,
				path: pagePathStr,
				order: maxOrder + 1,
				parentId: null,
			});
		}
	}
	return arr;
}

async function seedComps() {
	const { pagePath } = await import(path.join(REPO_ROOT, 'data/page/header.js'));
	const headerLinks = (await import(path.join(REPO_ROOT, 'data/page/header.js'))).default;
	const links = ensureHeaderLinks(headerLinks, pagePath);
	const headerData = JSON.stringify(links);

	await dbRun(
		`INSERT INTO comps (key, type, format, data, updated_at) VALUES ('header', 'comp', 'json', ?, datetime('now'))
		 ON CONFLICT(key) DO UPDATE SET type = excluded.type, format = excluded.format, data = excluded.data, updated_at = datetime('now')`,
		[headerData]
	);
	console.log('  ✓ Comp: header');

	const footerData = JSON.stringify(
		(await import(path.join(REPO_ROOT, 'data/page/footer.js'))).default
	);
	await dbRun(
		`INSERT INTO comps (key, type, format, data, updated_at) VALUES ('footer', 'comp', 'json', ?, datetime('now'))
		 ON CONFLICT(key) DO UPDATE SET type = excluded.type, format = excluded.format, data = excluded.data, updated_at = datetime('now')`,
		[footerData]
	);
	console.log('  ✓ Comp: footer');

	const themeData = JSON.stringify(
		(await import(path.join(REPO_ROOT, 'data/theme.js'))).default
	);
	await dbRun(
		`INSERT INTO comps (key, type, format, data, updated_at) VALUES ('theme', 'theme', 'json', ?, datetime('now'))
		 ON CONFLICT(key) DO UPDATE SET type = excluded.type, format = excluded.format, data = excluded.data, updated_at = datetime('now')`,
		[themeData]
	);
	console.log('  ✓ Comp: theme');
}

// ---------- Sync to remote ----------
async function syncPages(cookie) {
	console.log('\nSyncing pages...');
	const listRes = await fetch(`${CMS_URL}/api/pages`, { headers: apiHeaders(cookie) });
	if (!listRes.ok) {
		console.error(`  ✗ GET /api/pages failed: ${listRes.status}`);
		return;
	}
	const existingPages = (await listRes.json().catch(() => ({}))).data || [];
	const pages = await dbAll('SELECT * FROM pages ORDER BY id');

	for (const page of pages) {
		const existing = existingPages.find((p) => p.name.toLowerCase() === page.name.toLowerCase());
		const url = existing ? `${CMS_URL}/api/pages/${existing.id}` : `${CMS_URL}/api/pages`;
		const method = existing ? 'PUT' : 'POST';
		// Send all fields so remote pages table matches local; use null (not undefined) so API updates the column
		const body = {
			name: page.name,
			path: page.path ?? null,
			type: page.type || 'page',
			format: page.format || 'json',
			data: page.data ?? '',
			meta: page.meta ?? null,
			status: page.status || 'published',
		};
		if (existing) delete body.name;

		const res = await fetch(url, {
			method,
			headers: apiHeaders(cookie),
			body: JSON.stringify(body),
		});
		if (res.ok) {
			console.log(`  ✓ ${existing ? 'Updated' : 'Created'} page: ${page.name}`);
		} else {
			const err = await res.json().catch(() => ({}));
			console.error(`  ✗ Page ${page.name}: ${res.status} ${err.message || res.statusText}`);
		}
	}
}

async function syncComps(cookie) {
	console.log('\nSyncing comps...');
	const listRes = await fetch(`${CMS_URL}/api/comp`, { headers: apiHeaders(cookie) });
	if (!listRes.ok) {
		console.error(`  ✗ GET /api/comp failed: ${listRes.status}`);
		return;
	}
	const existingComp = (await listRes.json().catch(() => ({}))).data || [];
	const comps = await dbAll('SELECT * FROM comps ORDER BY id');

	for (const row of comps) {
		const existing = existingComp.find((c) => c.key === row.key);
		const url = existing ? `${CMS_URL}/api/comp/${existing.id}` : `${CMS_URL}/api/comp`;
		const method = existing ? 'PUT' : 'POST';
		const res = await fetch(url, {
			method,
			headers: apiHeaders(cookie),
			body: JSON.stringify({
				key: row.key,
				type: row.type || 'comp',
				format: row.format || 'json',
				data: row.data != null ? String(row.data) : '',
			}),
		});
		if (res.ok) {
			console.log(`  ✓ ${existing ? 'Updated' : 'Created'} comp: ${row.key}`);
		} else {
			const err = await res.json().catch(() => ({}));
			console.error(`  ✗ Comp ${row.key}: ${res.status} ${err.message || res.statusText}`);
		}
	}
}

async function syncSitemap(cookie) {
	console.log('\nSyncing sitemap...');
	const listRes = await fetch(`${CMS_URL}/api/sitemap`, { headers: apiHeaders(cookie) });
	if (!listRes.ok) {
		console.error(`  ✗ GET /api/sitemap failed: ${listRes.status}`);
		return;
	}
	const existingSitemap = (await listRes.json().catch(() => ({}))).data || [];
	const sitemap = await dbAll('SELECT * FROM sitemap ORDER BY id');

	for (const entry of sitemap) {
		const existing = existingSitemap.find((e) => e.url === entry.url);
		const url = existing
			? `${CMS_URL}/api/sitemap/${existing.id}`
			: `${CMS_URL}/api/sitemap`;
		const method = existing ? 'PUT' : 'POST';
		const res = await fetch(url, {
			method,
			headers: apiHeaders(cookie),
			body: JSON.stringify({
				url: entry.url,
				priority: entry.priority,
				changefreq: entry.changefreq,
				status: entry.status || 'active',
			}),
		});
		if (res.ok) {
			console.log(`  ✓ ${existing ? 'Updated' : 'Created'} sitemap: ${entry.url}`);
		} else {
			const err = await res.json().catch(() => ({}));
			console.error(`  ✗ Sitemap ${entry.url}: ${res.status} ${err.message || res.statusText}`);
		}
	}
}

async function main() {
	try {
		if (!LOCAL_ONLY && (!CMS_EMAIL || !CMS_PASSWORD)) {
			console.log(`Target CMS: ${CMS_URL}`);
			await getCredentials();
			console.log('');
		}

		// Ensure DB and migrations are applied
		const { default: Database } = await import('../database/db.js');
		const dbPath = path.isAbsolute(DB_PATH) ? DB_PATH : path.join(REPO_ROOT, DB_PATH);
		const database = new Database(dbPath);
		await database.connect();
		await database.init();
		await database.close();

		db = new sqlite3.Database(dbPath);
		dbRun = promisify(db.run.bind(db));
		dbAll = promisify(db.all.bind(db));

		console.log('Seeding local database...');
		await seedPages();
		await seedComps();
		console.log('✓ Local DB seeded.');

		if (!LOCAL_ONLY && CMS_EMAIL && CMS_PASSWORD) {
			console.log(`\nSyncing to remote CMS: ${CMS_URL}`);
			const cookie = await login();
			await syncPages(cookie);
			await syncComps(cookie);
			await syncSitemap(cookie);
			console.log('\n✓ Sync to remote complete.');
		} else if (!LOCAL_ONLY) {
			console.log('\nNo credentials: local DB only. Set CMS_EMAIL/CMS_PASSWORD to sync to remote.');
		}
	} catch (err) {
		console.error('\n✗ Error:', err.message);
		process.exit(1);
	} finally {
		if (db) db.close();
	}
}

main();
