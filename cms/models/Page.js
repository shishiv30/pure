class Page {
	constructor(db) {
		this.db = db;
	}

	async create(pageData) {
		const { name, title, content, meta_description, meta_keywords, status = 'draft', created_by } = pageData;

		const result = await this.db.run(
			`INSERT INTO pages (name, title, content, meta_description, meta_keywords, status, created_by, updated_by) 
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			[name, title, content || null, meta_description || null, meta_keywords || null, status, created_by, created_by]
		);

		return this.getById(result.lastID);
	}

	async getById(id) {
		return await this.db.get('SELECT * FROM pages WHERE id = ?', [id]);
	}

	async getByName(name) {
		return await this.db.get('SELECT * FROM pages WHERE name = ?', [name]);
	}

	async getAll() {
		return await this.db.all('SELECT * FROM pages ORDER BY updated_at DESC');
	}

	async getPublished() {
		return await this.db.all("SELECT * FROM pages WHERE status = 'published' ORDER BY updated_at DESC");
	}

	async update(id, pageData, updated_by) {
		const { title, content, meta_description, meta_keywords, status } = pageData;
		const updates = [];
		const values = [];

		if (title !== undefined) {
			updates.push('title = ?');
			values.push(title);
		}
		if (content !== undefined) {
			updates.push('content = ?');
			values.push(content);
		}
		if (meta_description !== undefined) {
			updates.push('meta_description = ?');
			values.push(meta_description);
		}
		if (meta_keywords !== undefined) {
			updates.push('meta_keywords = ?');
			values.push(meta_keywords);
		}
		if (status !== undefined) {
			updates.push('status = ?');
			values.push(status);
		}

		if (updates.length === 0) {
			return this.getById(id);
		}

		updates.push('updated_by = ?');
		updates.push('updated_at = CURRENT_TIMESTAMP');
		values.push(updated_by);
		values.push(id);

		await this.db.run(`UPDATE pages SET ${updates.join(', ')} WHERE id = ?`, values);
		return this.getById(id);
	}

	async delete(id) {
		await this.db.run('DELETE FROM pages WHERE id = ?', [id]);
	}
}

export default Page;
