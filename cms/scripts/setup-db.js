#!/usr/bin/env node

/**
 * CMS database setup script.
 * Creates the data directory, initializes the SQLite database and tables,
 * and optionally ensures .env exists with DB settings.
 *
 * Requires: npm install (in cms/) first.
 *
 * Usage (from repo root): node cms/scripts/setup-db.js
 * Usage (from cms/):      node scripts/setup-db.js
 * Or:                    npm run setup-db   (from cms/)
 *
 * Alternative (no Node deps): run ./cms/scripts/setup-db.sh then start the server once.
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CMS root is parent of scripts/
const CMS_ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(CMS_ROOT, '.env');
const ENV_EXAMPLE_PATH = path.join(CMS_ROOT, '.env.example');

function loadEnvFile(filePath) {
	if (!fs.existsSync(filePath)) return;
	const content = fs.readFileSync(filePath, 'utf8');
	for (const line of content.split('\n')) {
		const trimmed = line.trim();
		if (trimmed && !trimmed.startsWith('#')) {
			const eq = trimmed.indexOf('=');
			if (eq > 0) {
				const key = trimmed.slice(0, eq).trim();
				const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
				if (key && !process.env[key]) process.env[key] = value;
			}
		}
	}
}

function loadEnv() {
	if (fs.existsSync(ENV_PATH)) {
		loadEnvFile(ENV_PATH);
	} else if (fs.existsSync(ENV_EXAMPLE_PATH)) {
		loadEnvFile(ENV_EXAMPLE_PATH);
		console.log('No .env found; using .env.example for defaults.');
	}
}

function ensureEnvFile() {
	if (fs.existsSync(ENV_PATH)) {
		return;
	}
	if (!fs.existsSync(ENV_EXAMPLE_PATH)) {
		console.warn('Warning: .env.example not found. Create .env with DB_PATH and SESSION_SECRET.');
		return;
	}
	fs.copyFileSync(ENV_EXAMPLE_PATH, ENV_PATH);
	console.log('Created .env from .env.example. Please set SESSION_SECRET and other values.');
}

async function main() {
	process.chdir(CMS_ROOT);
	loadEnv();
	ensureEnvFile();

	const DB_PATH = process.env.DB_PATH || './data/cms.db';
	const dbDir = path.resolve(CMS_ROOT, path.dirname(DB_PATH));
	const dbFile = path.resolve(CMS_ROOT, DB_PATH);

	if (!fs.existsSync(dbDir)) {
		fs.mkdirSync(dbDir, { recursive: true });
		console.log('Created directory:', dbDir);
	}

	const { default: Database } = await import('../database/db.js');
	const db = new Database(dbFile);

	try {
		await db.init();
		console.log('Database initialized successfully.');
		console.log('DB path:', dbFile);
		console.log('Tables: users, pages, sitemap');
	} catch (err) {
		console.error('Database initialization failed:', err.message);
		process.exit(1);
	} finally {
		await db.close();
	}

	if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.includes('change-this')) {
		console.log('\nReminder: set SESSION_SECRET in .env to a secure random string.');
	}
	console.log('\nDone. Start the CMS with: npm run dev (from cms/) or node server.js');
}

main();
