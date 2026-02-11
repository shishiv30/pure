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

		// Pages table
		await this.db.run(`
			CREATE TABLE IF NOT EXISTS pages (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT UNIQUE NOT NULL,
				title TEXT NOT NULL,
				content TEXT,
				meta_description TEXT,
				meta_keywords TEXT,
				status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
				created_by INTEGER,
				updated_by INTEGER,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY(created_by) REFERENCES users(id),
				FOREIGN KEY(updated_by) REFERENCES users(id)
			)
		`);

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

		// Create indexes
		await this.db.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
		await this.db.run(`CREATE INDEX IF NOT EXISTS idx_pages_name ON pages(name)`);
		await this.db.run(`CREATE INDEX IF NOT EXISTS idx_sitemap_url ON sitemap(url)`);
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
