#!/usr/bin/env node
/**
 * Sync local CMS database to AWS CMS via API.
 * Reads local SQLite database and posts data to CMS API endpoints.
 *
 * Usage: node cms/scripts/sync-db-via-api.js [CMS_URL] [CMS_EMAIL] [CMS_PASSWORD]
 * Example: node cms/scripts/sync-db-via-api.js https://cms.conjeezou.com admin@example.com password
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

// Login to CMS and get session cookie
async function login() {
	console.log(`Logging in to ${CMS_URL}...`);
	const res = await fetch(`${CMS_URL}/api/auth/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		credentials: 'include',
		body: JSON.stringify({ email: CMS_EMAIL, password: CMS_PASSWORD })
	});

	if (!res.ok) {
		const error = await res.json();
		throw new Error(`Login failed: ${error.message || res.statusText}`);
	}

	const data = await res.json();
	console.log(`✓ Logged in as ${data.data.user.email}`);
	
	// Extract cookies from response
	const cookies = res.headers.get('set-cookie');
	return cookies;
}

// Sync pages
async function syncPages(cookies) {
	console.log('\nSyncing pages...');
	
	// Fetch existing pages from remote CMS
	const listRes = await fetch(`${CMS_URL}/api/pages`, {
		headers: {
			'Content-Type': 'application/json',
			'Cookie': cookies
		},
		credentials: 'include'
	});
	
	const listData = await listRes.json().catch(() => ({ data: [] }));
	const existingPages = listData.data || [];
	
	const pages = await dbAll('SELECT * FROM pages ORDER BY id');
	
	for (const page of pages) {
		try {
			// Find existing page by name (case-insensitive)
			const existing = existingPages.find((p) => p.name.toLowerCase() === page.name.toLowerCase());
			
			const url = existing 
				? `${CMS_URL}/api/pages/${existing.id}`
				: `${CMS_URL}/api/pages`;
			const method = existing ? 'PUT' : 'POST';
			
			const body = {
				name: page.name,
				title: page.title,
				type: page.type || 'html',
				data: page.data || '',
				meta: page.meta || '',
				status: page.status || 'published'
			};
			
			// For PUT, don't include name (it's immutable)
			if (existing && method === 'PUT') {
				delete body.name;
			}
			
			const res = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json',
					'Cookie': cookies
				},
				credentials: 'include',
				body: JSON.stringify(body)
			});

			if (res.ok) {
				console.log(`  ✓ ${existing ? 'Updated' : 'Created'} page: ${page.name}`);
			} else {
				const error = await res.json().catch(() => ({ message: res.statusText }));
				console.error(`  ✗ Failed to sync page ${page.name}: ${error.message}`);
			}
		} catch (error) {
			console.error(`  ✗ Error syncing page ${page.name}:`, error.message);
		}
	}
}

// Sync sitemap
async function syncSitemap(cookies) {
	console.log('\nSyncing sitemap...');
	
	// Fetch existing sitemap entries from remote CMS
	const listRes = await fetch(`${CMS_URL}/api/sitemap`, {
		headers: {
			'Content-Type': 'application/json',
			'Cookie': cookies
		},
		credentials: 'include'
	});
	
	const listData = await listRes.json().catch(() => ({ data: [] }));
	const existingSitemap = listData.data || [];
	
	const sitemap = await dbAll('SELECT * FROM sitemap ORDER BY id');
	
	for (const entry of sitemap) {
		try {
			// Find existing entry by URL
			const existing = existingSitemap.find((e) => e.url === entry.url);
			
			const url = existing
				? `${CMS_URL}/api/sitemap/${existing.id}`
				: `${CMS_URL}/api/sitemap`;
			const method = existing ? 'PUT' : 'POST';
			
			const res = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json',
					'Cookie': cookies
				},
				credentials: 'include',
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
				console.error(`  ✗ Failed to sync sitemap entry ${entry.url}: ${error.message}`);
			}
		} catch (error) {
			console.error(`  ✗ Error syncing sitemap entry ${entry.url}:`, error.message);
		}
	}
}

// Sync comp
async function syncComp(cookies) {
	console.log('\nSyncing comp...');
	
	// Fetch existing comp entries from remote CMS
	const listRes = await fetch(`${CMS_URL}/api/comp`, {
		headers: {
			'Content-Type': 'application/json',
			'Cookie': cookies
		},
		credentials: 'include'
	});
	
	const listData = await listRes.json().catch(() => ({ data: [] }));
	const existingComp = listData.data || [];
	
	const comp = await dbAll('SELECT * FROM comp ORDER BY id');
	
	for (const row of comp) {
		try {
			// Find existing comp by key
			const existing = existingComp.find((c) => c.key === row.key);
			
			const url = existing
				? `${CMS_URL}/api/comp/${existing.id}`
				: `${CMS_URL}/api/comp`;
			const method = existing ? 'PUT' : 'POST';
			
			// Ensure data is a string (it might be null or buffer)
			const compData = row.data != null ? String(row.data) : '';
			
			const res = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json',
					'Cookie': cookies
				},
				credentials: 'include',
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
				console.error(`  ✗ Failed to sync comp ${row.key}: ${errorMessage}`);
				console.error(`    Status: ${res.status}, URL: ${url}`);
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
		
		const cookies = await login();
		
		await syncPages(cookies);
		await syncSitemap(cookies);
		await syncComp(cookies);
		
		console.log('\n✓ Database sync complete!');
	} catch (error) {
		console.error('\n✗ Error:', error.message);
		process.exit(1);
	} finally {
		db.close();
	}
}

main();
