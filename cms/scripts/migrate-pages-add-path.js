/**
 * One-time migration: add path column to pages table if missing, then sync data from data/page/.
 * Run from repo root: node cms/scripts/migrate-pages-add-path.js
 * Uses same DB path resolution as CMS server (relative to process.cwd() or cms/ when default).
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import { execSync } from 'child_process';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
	require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
} catch {
	// dotenv optional
}

// Resolve DB path like CMS server: default ./data/cms.db relative to cms dir
const CMS_DIR = path.join(__dirname, '..');
const DB_PATH_RAW = process.env.DB_PATH || path.join(CMS_DIR, 'data', 'cms.db');
const dbPath = path.isAbsolute(DB_PATH_RAW) ? DB_PATH_RAW : path.resolve(process.cwd(), DB_PATH_RAW);

function addPathColumnIfMissing() {
	const sqlite3 = require('sqlite3');

	return new Promise((resolve, reject) => {
		const db = new sqlite3.Database(dbPath, (err) => {
			if (err) {
				reject(new Error(`Cannot open DB at ${dbPath}: ${err.message}`));
				return;
			}
		});

		db.run('ALTER TABLE pages ADD COLUMN path TEXT', (alterErr) => {
			if (alterErr) {
				if (alterErr.message && alterErr.message.includes('duplicate column name')) {
					console.log('pages.path column already exists');
					db.close();
					resolve();
					return;
				}
				db.close();
				reject(new Error(`ALTER TABLE failed: ${alterErr.message}. Ensure the pages table exists (start CMS once).`));
				return;
			}
			console.log('Added pages.path column');
			db.all(`PRAGMA table_info(pages)`, (verifyErr, cols) => {
				db.close();
				if (verifyErr) {
					reject(verifyErr);
					return;
				}
				const hasPathNow = cols && cols.some((c) => c.name === 'path');
				console.log(hasPathNow ? 'Verified: path column is present.' : 'Warning: path column not found after ALTER.');
				resolve();
			});
		});
	});
}

async function main() {
	console.log('DB path:', dbPath);
	await addPathColumnIfMissing();
	const root = path.join(__dirname, '..', '..');
	execSync('node cms/scripts/push-page-index.js published', { cwd: root, stdio: 'inherit' });
	execSync('node cms/scripts/push-page.js ai-trend data/page/ai-trend.js published', {
		cwd: root,
		stdio: 'inherit',
	});
	console.log('Migration and data sync done.');
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
