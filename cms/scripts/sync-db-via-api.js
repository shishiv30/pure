#!/usr/bin/env node
/**
 * Sync local CMS database to AWS CMS via API.
 * Reads local SQLite database and posts data to CMS API endpoints.
 *
 * Usage: node cms/scripts/sync-db-via-api.js [CMS_URL] [CMS_EMAIL] [CMS_PASSWORD]
 * Example: node cms/scripts/sync-db-via-api.js https://cms.conjeezou.com admin@example.com password
 *
 * If sync reports "Created/Updated" but you don't see changes on AWS: ensure CMS_URL is your
 * AWS CMS (e.g. https://cms.conjeezou.com), and the account is admin. If you see 401 on
 * GET /api/pages or POST/PUT, the session cookie was not accepted (fixed by sending only
 * the session cookie value in the Cookie header).
 */

import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CMS_URL = process.env.CMS_URL || process.argv[2] || 'https://cms.conjeezou.com';
let CMS_EMAIL = process.env.CMS_EMAIL || process.argv[3];
let CMS_PASSWORD = process.env.CMS_PASSWORD || process.argv[4];

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'cms.db');

// Prompt for credentials if not provided
function prompt(question) {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			rl.close();
			resolve(answer);
		});
	});
}

async function getCredentials() {
	if (!CMS_EMAIL) {
		CMS_EMAIL = await prompt('CMS Email: ');
	}
	if (!CMS_PASSWORD) {
		CMS_PASSWORD = await prompt('CMS Password: ');
		// Hide password input
		process.stdout.write('\x1B[1A\x1B[2K'); // Move up and clear line
	}
}

// Get credentials if needed
if (!CMS_EMAIL || !CMS_PASSWORD) {
	console.log(`Syncing local database to: ${CMS_URL}`);
	console.log('Please provide CMS credentials:\n');
	await getCredentials();
	console.log('');
}

// Open local database
const db = new sqlite3.Database(DB_PATH);
const dbAll = promisify(db.all.bind(db));
const dbGet = promisify(db.get.bind(db));

// Extract session cookie for Cookie header (same as push-page.js / push-comp.js)
function getCookie(res) {
	const setCookie = res.headers.get('set-cookie');
	if (!setCookie) return null;
	// First cookie only; strip attributes (Path=, HttpOnly, etc.) so Cookie header is valid
	return setCookie.split(',')[0].split(';')[0].trim();
}

// Login to CMS and get session cookie
async function login() {
	console.log(`Logging in to ${CMS_URL}...`);
	const res = await fetch(`${CMS_URL}/api/auth/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email: CMS_EMAIL, password: CMS_PASSWORD })
	});

	if (!res.ok) {
		const error = await res.json().catch(() => ({}));
		throw new Error(`Login failed: ${error.message || res.statusText}`);
	}

	const data = await res.json();
	console.log(`✓ Logged in as ${data.data.user.email}`);

	const cookie = getCookie(res);
	if (!cookie) {
		console.warn('Warning: No Set-Cookie in login response; API requests may be rejected (401).');
	}
	return cookie;
}

function apiHeaders(cookie) {
	const h = { 'Content-Type': 'application/json' };
	if (cookie) h.Cookie = cookie;
	return h;
}

// Sync pages
async function syncPages(cookie) {
	console.log('\nSyncing pages...');

	const listRes = await fetch(`${CMS_URL}/api/pages`, {
		headers: apiHeaders(cookie)
	});

	if (!listRes.ok) {
		const err = await listRes.json().catch(() => ({}));
		console.error(`  ✗ GET /api/pages failed: ${listRes.status} ${err.message || listRes.statusText}`);
		return;
	}

	const listData = await listRes.json().catch(() => ({ data: [] }));
	const existingPages = listData.data || [];

	const pages = await dbAll('SELECT * FROM pages ORDER BY id');

	for (const page of pages) {
		try {
			const existing = existingPages.find((p) => p.name.toLowerCase() === page.name.toLowerCase());
			const url = existing
				? `${CMS_URL}/api/pages/${existing.id}`
				: `${CMS_URL}/api/pages`;
			const method = existing ? 'PUT' : 'POST';

			// Omit path if remote DB may not have the column yet (run POST /api/setup/migrate-pages-path once, then sync again to send path)
			const body = {
				name: page.name,
				title: page.title,
				type: page.type || 'html',
				data: page.data || '',
				meta: page.meta || '',
				status: page.status || 'published'
			};
			if (existing && method === 'PUT') delete body.name;
			if (process.env.SYNC_INCLUDE_PATH === '1') body.path = page.path || undefined;

			const res = await fetch(url, {
				method,
				headers: apiHeaders(cookie),
				body: JSON.stringify(body)
			});

			if (res.ok) {
				console.log(`  ✓ ${existing ? 'Updated' : 'Created'} page: ${page.name}`);
			} else {
				const error = await res.json().catch(() => ({ message: res.statusText }));
				console.error(`  ✗ Failed to sync page ${page.name}: ${res.status} ${error.message}`);
			}
		} catch (error) {
			console.error(`  ✗ Error syncing page ${page.name}:`, error.message);
		}
	}
}

// Sync sitemap
async function syncSitemap(cookie) {
	console.log('\nSyncing sitemap...');

	const listRes = await fetch(`${CMS_URL}/api/sitemap`, {
		headers: apiHeaders(cookie)
	});
	if (!listRes.ok) {
		console.error(`  ✗ GET /api/sitemap failed: ${listRes.status}`);
		return;
	}

	const listData = await listRes.json().catch(() => ({ data: [] }));
	const existingSitemap = listData.data || [];
	const sitemap = await dbAll('SELECT * FROM sitemap ORDER BY id');

	for (const entry of sitemap) {
		try {
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
					status: entry.status || 'active'
				})
			});

			if (res.ok) {
				console.log(`  ✓ ${existing ? 'Updated' : 'Created'} sitemap entry: ${entry.url}`);
			} else {
				const error = await res.json().catch(() => ({ message: res.statusText }));
				console.error(`  ✗ Failed to sync sitemap entry ${entry.url}: ${res.status} ${error.message}`);
			}
		} catch (error) {
			console.error(`  ✗ Error syncing sitemap entry ${entry.url}:`, error.message);
		}
	}
}

// Sync comp
async function syncComp(cookie) {
	console.log('\nSyncing comp...');

	const listRes = await fetch(`${CMS_URL}/api/comp`, {
		headers: apiHeaders(cookie)
	});
	if (!listRes.ok) {
		console.error(`  ✗ GET /api/comp failed: ${listRes.status}`);
		return;
	}

	const listData = await listRes.json().catch(() => ({ data: [] }));
	const existingComp = listData.data || [];
	const comp = await dbAll('SELECT * FROM comp ORDER BY id');

	for (const row of comp) {
		try {
			const existing = existingComp.find((c) => c.key === row.key);
			const url = existing
				? `${CMS_URL}/api/comp/${existing.id}`
				: `${CMS_URL}/api/comp`;
			const method = existing ? 'PUT' : 'POST';
			const compData = row.data != null ? String(row.data) : '';

			const res = await fetch(url, {
				method,
				headers: apiHeaders(cookie),
				body: JSON.stringify({
					key: row.key,
					type: row.type || 'json',
					data: compData
				})
			});

			if (res.ok) {
				console.log(`  ✓ ${existing ? 'Updated' : 'Created'} comp: ${row.key}`);
			} else {
				const errorText = await res.text().catch(() => res.statusText);
				let errorMessage = res.statusText;
				try {
					const errorJson = JSON.parse(errorText);
					errorMessage = errorJson.message || errorMessage;
				} catch {
					errorMessage = errorText || errorMessage;
				}
				console.error(`  ✗ Failed to sync comp ${row.key}: ${res.status} ${errorMessage}`);
			}
		} catch (error) {
			console.error(`  ✗ Error syncing comp ${row.key}:`, error.message);
		}
	}
}

// Main
async function main() {
	try {
		// Get credentials if needed
		if (!CMS_EMAIL || !CMS_PASSWORD) {
			console.log(`Syncing local database to: ${CMS_URL}`);
			console.log('Please provide CMS credentials:\n');
			await getCredentials();
			console.log('');
		}
		
		console.log(`Local database: ${DB_PATH}`);
		console.log(`Target CMS: ${CMS_URL}\n`);

		const cookie = await login();
		if (!cookie) {
			console.error('Cannot sync without session cookie. Check that the CMS returns Set-Cookie on login.');
			process.exit(1);
		}

		await syncPages(cookie);
		await syncSitemap(cookie);
		await syncComp(cookie);

		console.log('\n✓ Database sync complete!');
	} catch (error) {
		console.error('\n✗ Error:', error.message);
		process.exit(1);
	} finally {
		db.close();
	}
}

main();
