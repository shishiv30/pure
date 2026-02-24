import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Database {
	constructor(dbPath) {
		this.dbPath = dbPath;
		this.db = null;
	}

	async connect() {
		return new Promise((resolve, reject) => {
			// Ensure data directory exists
			const dbDir = path.dirname(this.dbPath);
			if (!fs.existsSync(dbDir)) {
				fs.mkdirSync(dbDir, { recursive: true });
			}

			this.db = new sqlite3.Database(this.dbPath, (err) => {
				if (err) {
					reject(err);
				} else {
					this.db.run = promisify(this.db.run.bind(this.db));
					this.db.get = promisify(this.db.get.bind(this.db));
					this.db.all = promisify(this.db.all.bind(this.db));
					resolve();
				}
			});
		});
	}

	async init() {
		await this.connect();
		await this.createTables();
	}

	async migratePagesTable() {
		// If `pages` already exists with legacy columns, migrate to:
		// id, name, path, data, type(json|html), meta(seo json), status (+ audit columns)
		try {
			const columns = await this.db.all(`PRAGMA table_info(pages)`);
			if (!Array.isArray(columns) || columns.length === 0) return;
			const names = new Set(columns.map((c) => c.name));

			// Legacy schema had: content, meta_description, meta_keywords
			const isLegacy = names.has('content') || names.has('meta_description') || names.has('meta_keywords');
			const hasNew = names.has('data') && names.has('type') && names.has('meta');
			if (!isLegacy || hasNew) return;

			await this.db.run('BEGIN TRANSACTION');
			await this.db.run(`
				CREATE TABLE IF NOT EXISTS pages_new (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					name TEXT UNIQUE NOT NULL,
					path TEXT,
					data TEXT,
					type TEXT NOT NULL DEFAULT 'html' CHECK(type IN ('json', 'html')),
					meta TEXT,
					status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
					created_by INTEGER,
					updated_by INTEGER,
					created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
					updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
					FOREIGN KEY(created_by) REFERENCES users(id),
					FOREIGN KEY(updated_by) REFERENCES users(id)
				)
			`);

			// Best-effort meta migration: wrap old meta fields into JSON string.
			await this.db.run(`
				INSERT INTO pages_new (
					id,
					name,
					path,
					data,
					type,
					meta,
					status,
					created_by,
					updated_by,
					created_at,
					updated_at
				)
				SELECT
					id,
					name,
					NULL AS path,
					content AS data,
					'html' AS type,
					'{"description":' ||
						COALESCE(REPLACE(quote(meta_description), '''', '"'), 'null') ||
						',"keywords":' ||
						COALESCE(REPLACE(quote(meta_keywords), '''', '"'), 'null') ||
					'}' AS meta,
					status,
					created_by,
					updated_by,
					created_at,
					updated_at
				FROM pages
			`);

			await this.db.run('DROP TABLE pages');
			await this.db.run('ALTER TABLE pages_new RENAME TO pages');
			await this.db.run('COMMIT');
		} catch (err) {
			try {
				await this.db.run('ROLLBACK');
			} catch {
				// ignore
			}
			console.error('Pages table migration failed:', err);
		}
	}

	// Rename comp -> comps and reset type per data/page/type.js (comp, page, them)
	async migrateCompToComps() {
		try {
			const tables = await this.db.all(
				"SELECT name FROM sqlite_master WHERE type='table' AND name IN ('comp', 'comps')"
			);
			const names = tables.map((t) => t.name);
			if (!names.includes('comp') && !names.includes('comps')) return;

			if (names.includes('comp') && !names.includes('comps')) {
				await this.db.run('ALTER TABLE comp RENAME TO comps');
			} else if (names.includes('comp') && names.includes('comps')) {
				await this.db.run('DROP TABLE comp');
			}
			await this.db.run(
				"UPDATE comps SET type = CASE WHEN key = 'theme' THEN 'theme' ELSE 'comp' END WHERE type NOT IN ('comp', 'page', 'theme')"
			);
			await this.db.run('DROP INDEX IF EXISTS idx_comp_key');
			await this.db.run('CREATE INDEX IF NOT EXISTS idx_comps_key ON comps(key)');
		} catch (err) {
			console.error('Comp to comps migration failed:', err);
		}
	}

	// Add updated_at column to comps
	async migrateCompsUpdatedAt() {
		try {
			const columns = (await this.db.all('PRAGMA table_info(comps)')).map((c) => c.name);
			if (columns.includes('updated_at')) return;

			await this.db.run('ALTER TABLE comps ADD COLUMN updated_at DATETIME');
			await this.db.run('UPDATE comps SET updated_at = datetime("now") WHERE updated_at IS NULL');
		} catch (err) {
			console.error('Comps updated_at migration failed:', err);
		}
	}

	// Fix comps CHECK: them -> theme
	async migrateCompsThemeType() {
		try {
			const info = await this.db.get(
				"SELECT sql FROM sqlite_master WHERE type='table' AND name='comps'"
			);
			if (!info?.sql || !info.sql.includes("'them'")) return;

			await this.db.run('BEGIN TRANSACTION');
			await this.db.run(`
				CREATE TABLE comps_new (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					key TEXT UNIQUE NOT NULL,
					type TEXT NOT NULL CHECK(type IN ('comp', 'page', 'theme')),
					format TEXT DEFAULT 'json' CHECK(format IN ('json', 'html')),
					data TEXT NOT NULL,
					updated_at DATETIME
				)
			`);
			await this.db.run(`
				INSERT INTO comps_new (id, key, type, format, data, updated_at)
				SELECT id, key, CASE WHEN type = 'them' THEN 'theme' ELSE type END, format, data, updated_at
				FROM comps
			`);
			await this.db.run('DROP TABLE comps');
			await this.db.run('ALTER TABLE comps_new RENAME TO comps');
			await this.db.run('CREATE INDEX IF NOT EXISTS idx_comps_key ON comps(key)');
			await this.db.run('COMMIT');
		} catch (err) {
			try {
				await this.db.run('ROLLBACK');
			} catch {
				// ignore
			}
			console.error('Comps theme type migration failed:', err);
		}
	}

	// Add format column to comps (json|html)
	async migrateCompsFormat() {
		try {
			const columns = (await this.db.all('PRAGMA table_info(comps)')).map((c) => c.name);
			if (columns.includes('format')) return;

			await this.db.run("ALTER TABLE comps ADD COLUMN format TEXT DEFAULT 'json'");
			await this.db.run("UPDATE comps SET format = 'json' WHERE format IS NULL");
		} catch (err) {
			console.error('Comps format migration failed:', err);
		}
	}

	// Reset pages.type to type.js values (page) and add format for json|html
	async migratePagesType() {
		try {
			const columns = await this.db.all(`PRAGMA table_info(pages)`);
			if (!Array.isArray(columns) || columns.length === 0) return;
			const names = new Set(columns.map((c) => c.name));
			if (names.has('format')) return;

			await this.db.run('BEGIN TRANSACTION');
			await this.db.run(`
				CREATE TABLE pages_new (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					name TEXT UNIQUE NOT NULL,
					path TEXT,
					data TEXT,
					type TEXT NOT NULL DEFAULT 'page' CHECK(type IN ('comp', 'page', 'theme')),
					format TEXT DEFAULT 'json' CHECK(format IN ('json', 'html')),
					meta TEXT,
					status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
					created_by INTEGER,
					updated_by INTEGER,
					created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
					updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
					FOREIGN KEY(created_by) REFERENCES users(id),
					FOREIGN KEY(updated_by) REFERENCES users(id)
				)
			`);
			await this.db.run(`
				INSERT INTO pages_new (id, name, path, data, type, format, meta, status,
					created_by, updated_by, created_at, updated_at)
				SELECT id, name, path, data, 'page', type, meta, status,
					created_by, updated_by, created_at, updated_at
				FROM pages
			`);
			await this.db.run('DROP TABLE pages');
			await this.db.run('ALTER TABLE pages_new RENAME TO pages');
			await this.db.run('CREATE INDEX IF NOT EXISTS idx_pages_name ON pages(name)');
			await this.db.run('COMMIT');
		} catch (err) {
			try {
				await this.db.run('ROLLBACK');
			} catch {
				// ignore
			}
			console.error('Pages type migration failed:', err);
		}
	}

	// Fix page records that still have type json/html: set type='page' and format
	async migratePagesTypeFix() {
		try {
			const names = new Set(
				(await this.db.all('PRAGMA table_info(pages)')).map((c) => c.name)
			);
			if (!names.has('format')) return;

			await this.db.run(`
				UPDATE pages SET
					format = CASE WHEN type IN ('json', 'html') THEN type ELSE COALESCE(format, 'json') END,
					type = 'page'
				WHERE type IN ('json', 'html')
			`);
		} catch (err) {
			console.error('Pages type fix migration failed:', err);
		}
	}

	// Drop title column from pages (display label derived from name in UI)
	async migratePagesDropTitle() {
		try {
			const columns = await this.db.all(`PRAGMA table_info(pages)`);
			if (!Array.isArray(columns) || columns.length === 0) return;
			const names = new Set(columns.map((c) => c.name));
			if (!names.has('title')) return;

			await this.db.run('BEGIN TRANSACTION');
			await this.db.run(`
				CREATE TABLE pages_new (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					name TEXT UNIQUE NOT NULL,
					path TEXT,
					data TEXT,
					type TEXT NOT NULL DEFAULT 'page' CHECK(type IN ('comp', 'page', 'theme')),
					format TEXT DEFAULT 'json' CHECK(format IN ('json', 'html')),
					meta TEXT,
					status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
					created_by INTEGER,
					updated_by INTEGER,
					created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
					updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
					FOREIGN KEY(created_by) REFERENCES users(id),
					FOREIGN KEY(updated_by) REFERENCES users(id)
				)
			`);
			await this.db.run(`
				INSERT INTO pages_new (id, name, path, data, type, format, meta, status,
					created_by, updated_by, created_at, updated_at)
				SELECT id, name, path, data, type, format, meta, status,
					created_by, updated_by, created_at, updated_at
				FROM pages
			`);
			await this.db.run('DROP TABLE pages');
			await this.db.run('ALTER TABLE pages_new RENAME TO pages');
			await this.db.run('CREATE INDEX IF NOT EXISTS idx_pages_name ON pages(name)');
			await this.db.run('COMMIT');
		} catch (err) {
			try {
				await this.db.run('ROLLBACK');
			} catch {
				// ignore
			}
			console.error('Pages drop title migration failed:', err);
		}
	}

	async createTables() {
		// Users table
		await this.db.run(`
			CREATE TABLE IF NOT EXISTS users (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				email TEXT UNIQUE NOT NULL,
				name TEXT NOT NULL,
				password TEXT NOT NULL,
				phone TEXT,
				role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin')),
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
			)
		`);

		// Pages table (name = page key, path = page path e.g. page/index)
		await this.db.run(`
			CREATE TABLE IF NOT EXISTS pages (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT UNIQUE NOT NULL,
				path TEXT,
				data TEXT,
				type TEXT NOT NULL DEFAULT 'page' CHECK(type IN ('comp', 'page', 'theme')),
				format TEXT DEFAULT 'json' CHECK(format IN ('json', 'html')),
				meta TEXT,
				status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
				created_by INTEGER,
				updated_by INTEGER,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY(created_by) REFERENCES users(id),
				FOREIGN KEY(updated_by) REFERENCES users(id)
			)
		`);
		await this.migratePagesTable();
		await this.migratePagesType();
		await this.migratePagesTypeFix();
		await this.migratePagesDropTitle();

		// Sitemap table
		await this.db.run(`
			CREATE TABLE IF NOT EXISTS sitemap (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				url TEXT NOT NULL,
				priority REAL DEFAULT 0.5 CHECK(priority >= 0 AND priority <= 1),
				changefreq TEXT DEFAULT 'weekly' CHECK(changefreq IN ('always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never')),
				lastmod DATETIME,
				status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
			)
		`);

		// Comps table (key, type per data/page/type.js, format, data)
		await this.migrateCompToComps();
		await this.db.run(`
			CREATE TABLE IF NOT EXISTS comps (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				key TEXT UNIQUE NOT NULL,
				type TEXT NOT NULL CHECK(type IN ('comp', 'page', 'theme')),
				format TEXT DEFAULT 'json' CHECK(format IN ('json', 'html')),
				data TEXT NOT NULL,
				updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
			)
		`);
		await this.migrateCompsFormat();
		await this.migrateCompsUpdatedAt();
		await this.migrateCompsThemeType();

		// Create indexes
		await this.db.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
		await this.db.run(`CREATE INDEX IF NOT EXISTS idx_pages_name ON pages(name)`);
		await this.db.run(`CREATE INDEX IF NOT EXISTS idx_sitemap_url ON sitemap(url)`);
		await this.db.run(`CREATE INDEX IF NOT EXISTS idx_comps_key ON comps(key)`);
	}

	async close() {
		return new Promise((resolve, reject) => {
			if (this.db) {
				this.db.close((err) => {
					if (err) reject(err);
					else resolve();
				});
			} else {
				resolve();
			}
		});
	}

	getDb() {
		return this.db;
	}
}

export default Database;
