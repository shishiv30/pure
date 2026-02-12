/**
 * Push page data into CMS pages table and optionally update header comp with link to /page/:key.
 * Usage: node cms/scripts/push-page.js <key> [dataModule] [status] [--update-header]
 *   key: URL key (e.g. index, about) → CMS page name = page<key> (e.g. pageindex)
 *   dataModule: path to data module relative to repo root (default: data/page<key>.js)
 *   status: draft | published (default: published)
 *   --update-header: add/update header comp link with path /page/<key>
 *
 * Run from repo root. Requires CMS_EMAIL/CMS_PASSWORD for API; else writes to CMS DB directly.
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
	require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
} catch {
	// dotenv optional
}

const CMS_URL = (process.env.CMS_URL || 'http://localhost:3003').replace(/\/$/, '');
const CMS_EMAIL = process.env.CMS_EMAIL;
const CMS_PASSWORD = process.env.CMS_PASSWORD;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'cms.db');

const argv = process.argv.slice(2);
const updateHeader = argv.includes('--update-header');
const args = argv.filter((a) => a !== '--update-header');
const key = args[0];
const dataModule = args[1] || `data/page${key}.js`;
const status = ['draft', 'published'].includes(args[2]) ? args[2] : 'published';

if (!key) {
	console.error('Usage: node cms/scripts/push-page.js <key> [dataModule] [status] [--update-header]');
	console.error('  e.g. node cms/scripts/push-page.js index');
	console.error('  e.g. node cms/scripts/push-page.js about data/pageabout.js published --update-header');
	process.exit(1);
}

const PAGE_NAME = `page${key}`.toLowerCase();
const PAGE_PATH = `/page/${key}`;

function getCookie(loginRes) {
	const setCookie = loginRes.headers.get('set-cookie');
	if (!setCookie) return '';
	return setCookie.split(',')[0].split(';')[0].trim();
}

async function getAuthHeaders() {
	if (!CMS_EMAIL || !CMS_PASSWORD) return null;
	const loginRes = await fetch(`${CMS_URL}/api/auth/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email: CMS_EMAIL, password: CMS_PASSWORD }),
	});
	if (!loginRes.ok) {
		const err = await loginRes.json().catch(() => ({}));
		console.error('Login failed:', err.message || loginRes.statusText);
		process.exit(1);
	}
	const cookie = getCookie(loginRes);
	return {
		'Content-Type': 'application/json',
		...(cookie ? { Cookie: cookie } : {}),
	};
}

// ---------- Page push ----------
async function pushPageViaApi(dataJson, title, meta) {
	const headers = await getAuthHeaders();
	const listRes = await fetch(`${CMS_URL}/api/pages`, { credentials: 'include', headers });
	if (!listRes.ok) {
		console.error('GET /api/pages failed:', listRes.statusText);
		process.exit(1);
	}
	const listData = await listRes.json().catch(() => ({}));
	const pages = listData.data || [];
	const existing = pages.find((p) => p.name.toLowerCase() === PAGE_NAME);

	const body = {
		name: PAGE_NAME,
		title: title || key,
		type: 'json',
		data: dataJson,
		meta: meta ? JSON.stringify(meta) : null,
		status,
	};

	if (existing) {
		const putRes = await fetch(`${CMS_URL}/api/pages/${existing.id}`, {
			method: 'PUT',
			headers,
			body: JSON.stringify({
				title: body.title,
				data: body.data,
				type: body.type,
				meta: body.meta,
				status: body.status,
			}),
		});
		const result = await putRes.json().catch(() => ({}));
		if (!putRes.ok) {
			console.error('PUT /api/pages/:id failed:', result.message || putRes.statusText);
			process.exit(1);
		}
		console.log(result.message || 'OK', `- page "${PAGE_NAME}" updated, status: ${status}`);
	} else {
		const postRes = await fetch(`${CMS_URL}/api/pages`, {
			method: 'POST',
			headers,
			body: JSON.stringify(body),
		});
		const result = await postRes.json().catch(() => ({}));
		if (!postRes.ok) {
			console.error('POST /api/pages failed:', result.message || postRes.statusText);
			process.exit(1);
		}
		console.log(result.message || 'OK', `- page "${PAGE_NAME}" created, status: ${status}`);
	}
}

function pushPageViaDb(dataJson, title, meta) {
	const sqlite3 = require('sqlite3');
	const dbPath = path.isAbsolute(DB_PATH) ? DB_PATH : path.join(__dirname, '..', DB_PATH);
	const metaStr = meta ? JSON.stringify(meta) : null;

	return new Promise((resolve, reject) => {
		const db = new sqlite3.Database(dbPath, (err) => {
			if (err) {
				reject(err);
				return;
			}
		});

		db.run(
			`INSERT INTO pages (name, title, data, type, meta, status, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
			 ON CONFLICT(name) DO UPDATE SET
			   title = excluded.title,
			   data = excluded.data,
			   type = excluded.type,
			   meta = excluded.meta,
			   status = excluded.status,
			   updated_at = CURRENT_TIMESTAMP`,
			[PAGE_NAME, title || key, dataJson, 'json', metaStr, status],
			(err) => {
				db.close();
				if (err) reject(err);
				else resolve();
			},
		);
	});
}

// ---------- Header comp: ensure link /page/<key> and push ----------
function ensureHeaderLink(links, pageTitle) {
	const arr = Array.isArray(links) ? [...links] : [];
	const existingIndex = arr.findIndex(
		(row) => row.path === PAGE_PATH || row.path === `${PAGE_PATH}/`,
	);
	const text = pageTitle || key;
	const maxId = arr.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0);
	const maxOrder = arr.reduce((m, r) => Math.max(m, Number(r.order) ?? 0), 0);

	if (existingIndex >= 0) {
		arr[existingIndex] = { ...arr[existingIndex], text, path: PAGE_PATH };
		return arr;
	}
	arr.push({
		id: maxId + 1,
		text,
		path: PAGE_PATH,
		order: maxOrder + 1,
		parentId: null,
	});
	return arr;
}

async function getHeaderViaApi() {
	const res = await fetch(`${CMS_URL}/api/comp/public/header`);
	if (!res.ok) return null;
	const json = await res.json().catch(() => ({}));
	const row = json?.data;
	if (!row || !row.data) return null;
	const raw = row.data;
	return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

function getHeaderViaDb() {
	const sqlite3 = require('sqlite3');
	const dbPath = path.isAbsolute(DB_PATH) ? DB_PATH : path.join(__dirname, '..', DB_PATH);
	return new Promise((resolve, reject) => {
		const db = new sqlite3.Database(dbPath, (err) => {
			if (err) {
				reject(err);
				return;
			}
		});
		db.get('SELECT data FROM comp WHERE key = ?', ['header'], (err, row) => {
			db.close();
			if (err) {
				reject(err);
				return;
			}
			if (!row || !row.data) {
				resolve(null);
				return;
			}
			try {
				resolve(JSON.parse(row.data));
			} catch {
				resolve(null);
			}
		});
	});
}

async function pushHeaderViaApi(dataJson) {
	const headers = await getAuthHeaders();
	const postRes = await fetch(`${CMS_URL}/api/comp`, {
		method: 'POST',
		headers,
		body: JSON.stringify({ key: 'header', type: 'json', data: dataJson }),
	});
	const result = await postRes.json().catch(() => ({}));
	if (!postRes.ok) {
		console.error('POST /api/comp (header) failed:', result.message || postRes.statusText);
		process.exit(1);
	}
	console.log(result.message || 'OK', '- header comp updated with link', PAGE_PATH);
}

function pushHeaderViaDb(dataJson) {
	const sqlite3 = require('sqlite3');
	const dbPath = path.isAbsolute(DB_PATH) ? DB_PATH : path.join(__dirname, '..', DB_PATH);
	return new Promise((resolve, reject) => {
		const db = new sqlite3.Database(dbPath, (err) => {
			if (err) {
				reject(err);
				return;
			}
		});
		db.run(
			`INSERT INTO comp (key, type, data) VALUES (?, ?, ?)
			 ON CONFLICT(key) DO UPDATE SET type = excluded.type, data = excluded.data`,
			['header', 'json', dataJson],
			(err) => {
				db.close();
				if (err) reject(err);
				else resolve();
			},
		);
	});
}

async function updateHeaderInCms(pageTitle) {
	const useApi = !!(CMS_EMAIL && CMS_PASSWORD);
	const current =
		useApi
			? await getHeaderViaApi()
			: await getHeaderViaDb();

	const links = ensureHeaderLink(current, pageTitle);
	const dataJson = JSON.stringify(links);

	if (useApi) {
		await pushHeaderViaApi(dataJson);
	} else {
		await pushHeaderViaDb(dataJson);
		console.log('OK - header comp updated with link', PAGE_PATH, '(written to DB)');
	}
}

async function main() {
	const modPath = dataModule.startsWith('data/') ? `../../${dataModule}` : `../../data/${dataModule}`;
	let payload;
	let pageTitle = key;
	try {
		const mod = await import(modPath);
		payload = mod.default;
		if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
			pageTitle = payload.title ?? pageTitle;
		}
	} catch (err) {
		console.error('Failed to load data module:', dataModule, err.message);
		process.exit(1);
	}

	const dataJson = typeof payload === 'string' ? payload : JSON.stringify(payload);
	const meta = { path: PAGE_PATH };

	if (CMS_EMAIL && CMS_PASSWORD) {
		await pushPageViaApi(dataJson, pageTitle, meta);
	} else {
		await pushPageViaDb(dataJson, pageTitle, meta);
		console.log('OK - page:', PAGE_NAME, 'type: json (written to DB), status:', status);
	}

	if (updateHeader) {
		await updateHeaderInCms(pageTitle);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
