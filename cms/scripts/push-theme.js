/**
 * Push theme data into CMS comp table.
 * Usage: node cms/scripts/push-theme.js
 *
 * Run from repo root. Without CMS_EMAIL/CMS_PASSWORD writes directly to CMS DB.
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
	require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch {
	// dotenv optional
}

const CMS_URL = (process.env.CMS_URL || 'http://localhost:3003').replace(/\/$/, '');
const CMS_EMAIL = process.env.CMS_EMAIL;
const CMS_PASSWORD = process.env.CMS_PASSWORD;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'cms.db');

const key = 'theme';
const dataModule = 'data/theme.js';

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

	const cookie = loginRes.headers.get('set-cookie');
	const postRes = await fetch(`${CMS_URL}/api/comp`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(cookie ? { Cookie: cookie.split(',')[0].split(';')[0].trim() } : {}),
		},
		body: JSON.stringify({
			key,
			type: 'json',
			data: dataJson,
		}),
	});

	const result = await postRes.json().catch(() => ({}));
	if (!postRes.ok) {
		console.error('POST /api/comp failed:', result.message || postRes.statusText);
		process.exit(1);
	}

	console.log(result.message || 'OK', `- key: ${key}, type: json`);
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
			`INSERT INTO comp (key, type, data) VALUES (?, ?, ?)
			 ON CONFLICT(key) DO UPDATE SET type = excluded.type, data = excluded.data`,
			[key, 'json', dataJson],
			(err) => {
				db.close();
				if (err) reject(err);
				else resolve();
			},
		);
	});
}

async function main() {
	const modPath = dataModule.startsWith('data/') ? `../../${dataModule}` : `../../data/${dataModule}`;
	const themeData = (await import(modPath)).default;
	const dataJson = JSON.stringify(themeData);

	if (CMS_EMAIL && CMS_PASSWORD) {
		await pushViaApi(dataJson);
	} else {
		await pushViaDb(dataJson);
		console.log('OK - key:', key, 'type: json (written to DB)');
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
