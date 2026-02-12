class Comp {
	constructor(db) {
		this.db = db;
	}

	async create(compData) {
		const { key, type, data } = compData;

		const result = await this.db.run(
			'INSERT INTO comp (key, type, data) VALUES (?, ?, ?)',
			[key, type, data]
		);

		return this.getById(result.lastID);
	}

	async getById(id) {
		return await this.db.get('SELECT * FROM comp WHERE id = ?', [id]);
	}

	async getByKey(key) {
		return await this.db.get('SELECT * FROM comp WHERE key = ?', [key]);
	}

	async getAll() {
		return await this.db.all('SELECT * FROM comp ORDER BY key');
	}

	async update(id, compData) {
		const { key, type, data } = compData;
		const updates = [];
		const values = [];

		if (key !== undefined) {
			updates.push('key = ?');
			values.push(key);
		}
		if (type !== undefined) {
			updates.push('type = ?');
			values.push(type);
		}
		if (data !== undefined) {
			updates.push('data = ?');
			values.push(data);
		}

		if (updates.length === 0) {
			return this.getById(id);
		}

		values.push(id);
		await this.db.run(`UPDATE comp SET ${updates.join(', ')} WHERE id = ?`, values);
		return this.getById(id);
	}

	async upsertByKey(key, compData) {
		const existing = await this.getByKey(key);
		const { type, data } = compData;

		if (existing) {
			await this.db.run('UPDATE comp SET type = ?, data = ? WHERE key = ?', [
				type,
				data,
				key
			]);
			return this.getByKey(key);
		}

		return this.create({ key, type, data });
	}

	async delete(id) {
		await this.db.run('DELETE FROM comp WHERE id = ?', [id]);
	}
}

export default Comp;
