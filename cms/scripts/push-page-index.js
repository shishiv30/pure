/**
 * Push index page section data (data/pageindex.js) into CMS pages table.
 * Creates or updates page with name "index", type json, data = pageindex payload.
 * Usage: node cms/scripts/push-page-index.js [status]
 *   status: draft | published (default: published)
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

const PAGE_NAME = 'pageIndex';
const PAGE_TITLE = 'Pure Home';
const PAGE_META = {
	title: 'Pure Home',
	desc: 'Author: Conjee Zou, UI solution, Category: Home',
	keywords: '',
	path: 'page/index',
};
const status = ['draft', 'published'].includes(process.argv[2])
	? process.argv[2]
	: 'published';

function getCookie(loginRes) {
	const setCookie = loginRes.headers.get('set-cookie');
	if (!setCookie) return '';
	return setCookie.split(',')[0].split(';')[0].trim();
}

async function pushViaApi(dataJson) {
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
	const headers = {
		'Content-Type': 'application/json',
		...(cookie ? { Cookie: cookie } : {}),
	};

	const listRes = await fetch(`${CMS_URL}/api/pages`, { credentials: 'include', headers });
	if (!listRes.ok) {
		console.error('GET /api/pages failed:', listRes.statusText);
		process.exit(1);
	}
	const listData = await listRes.json().catch(() => ({}));
	const pages = listData.data || [];
	const existing = pages.find((p) => p.name === PAGE_NAME);

	const body = {
		name: PAGE_NAME,
		title: PAGE_TITLE,
		type: 'json',
		data: dataJson,
		meta: JSON.stringify(PAGE_META),
		status,
	};

	if (existing) {
		const putRes = await fetch(`${CMS_URL}/api/pages/${existing.id}`, {
			method: 'PUT',
			headers,
			body: JSON.stringify({ title: body.title, data: body.data, type: body.type, meta: body.meta, status: body.status }),
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

function pushViaDb(dataJson) {
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
			`INSERT INTO pages (name, title, data, type, meta, status, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
			 ON CONFLICT(name) DO UPDATE SET
			   title = excluded.title,
			   data = excluded.data,
			   type = excluded.type,
			   meta = excluded.meta,
			   status = excluded.status,
			   updated_at = CURRENT_TIMESTAMP`,
			[PAGE_NAME, PAGE_TITLE, dataJson, 'json', JSON.stringify(PAGE_META), status],
			(err) => {
				db.close();
				if (err) reject(err);
				else resolve();
			},
		);
	});
}

async function main() {
	const mod = await import('../../data/pageindex.js');
	const payload = mod.default;
	const dataJson = typeof payload === 'string' ? payload : JSON.stringify(payload);

	if (CMS_EMAIL && CMS_PASSWORD) {
		await pushViaApi(dataJson);
	} else {
		await pushViaDb(dataJson);
		console.log('OK - page:', PAGE_NAME, 'type: json (written to DB), status:', status);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
