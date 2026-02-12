class Page {
	constructor(db) {
		this.db = db;
	}

	async create(pageData) {
		const {
			name,
			title,
			data,
			type = 'html',
			meta,
			status = 'draft',
			created_by,
		} = pageData;

		const result = await this.db.run(
			`INSERT INTO pages (name, title, data, type, meta, status, created_by, updated_by) 
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				name,
				title,
				data || null,
				type,
				meta || null,
				status,
				created_by,
				created_by,
			],
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
		const { name, title, data, type, meta, status } = pageData;
		const updates = [];
		const values = [];

		if (name !== undefined) {
			updates.push('name = ?');
			values.push(name);
		}
		if (title !== undefined) {
			updates.push('title = ?');
			values.push(title);
		}
		if (data !== undefined) {
			updates.push('data = ?');
			values.push(data);
		}
		if (type !== undefined) {
			updates.push('type = ?');
			values.push(type);
		}
		if (meta !== undefined) {
			updates.push('meta = ?');
			values.push(meta);
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
