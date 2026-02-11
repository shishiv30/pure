class Sitemap {
	constructor(db) {
		this.db = db;
	}

	async create(sitemapData) {
		const { url, priority = 0.5, changefreq = 'weekly', lastmod, status = 'active' } = sitemapData;

		const result = await this.db.run(
			`INSERT INTO sitemap (url, priority, changefreq, lastmod, status) 
			 VALUES (?, ?, ?, ?, ?)`,
			[url, priority, changefreq, lastmod || null, status]
		);

		return this.getById(result.lastID);
	}

	async getById(id) {
		return await this.db.get('SELECT * FROM sitemap WHERE id = ?', [id]);
	}

	async getByUrl(url) {
		return await this.db.get('SELECT * FROM sitemap WHERE url = ?', [url]);
	}

	async getAll() {
		return await this.db.all('SELECT * FROM sitemap ORDER BY priority DESC, updated_at DESC');
	}

	async getActive() {
		return await this.db.all("SELECT * FROM sitemap WHERE status = 'active' ORDER BY priority DESC, updated_at DESC");
	}

	async update(id, sitemapData) {
		const { url, priority, changefreq, lastmod, status } = sitemapData;
		const updates = [];
		const values = [];

		if (url !== undefined) {
			updates.push('url = ?');
			values.push(url);
		}
		if (priority !== undefined) {
			updates.push('priority = ?');
			values.push(priority);
		}
		if (changefreq !== undefined) {
			updates.push('changefreq = ?');
			values.push(changefreq);
		}
		if (lastmod !== undefined) {
			updates.push('lastmod = ?');
			values.push(lastmod);
		}
		if (status !== undefined) {
			updates.push('status = ?');
			values.push(status);
		}

		if (updates.length === 0) {
			return this.getById(id);
		}

		updates.push('updated_at = CURRENT_TIMESTAMP');
		values.push(id);

		await this.db.run(`UPDATE sitemap SET ${updates.join(', ')} WHERE id = ?`, values);
		return this.getById(id);
	}

	async delete(id) {
		await this.db.run('DELETE FROM sitemap WHERE id = ?', [id]);
	}
}

export default Sitemap;
