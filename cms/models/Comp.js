class Comp {
	constructor(db) {
		this.db = db;
	}

	async create(compData) {
		const { key, type, format = 'json', data } = compData;

		await this.db.run(
			'INSERT INTO comps (key, type, format, data, updated_at) VALUES (?, ?, ?, ?, datetime("now"))',
			[key, type, format, data]
		);

		return this.getByKey(key);
	}

	async getById(id) {
		return await this.db.get('SELECT * FROM comps WHERE id = ?', [id]);
	}

	async getByKey(key) {
		return await this.db.get('SELECT * FROM comps WHERE key = ?', [key]);
	}

	/** @param {string[]} keys - e.g. ['header', 'footer', 'theme'] */
	async getByKeys(keys) {
		if (!keys?.length) return [];
		const placeholders = keys.map(() => '?').join(',');
		return await this.db.all(
			`SELECT * FROM comps WHERE key IN (${placeholders}) ORDER BY key`,
			keys
		);
	}

	async getAll() {
		return await this.db.all('SELECT * FROM comps ORDER BY key');
	}

	/** @param {string} type - e.g. 'comp' */
	async getByType(type) {
		if (!type) return [];
		return await this.db.all('SELECT * FROM comps WHERE type = ? ORDER BY key', [type]);
	}

	async update(id, compData) {
		const { key, type, format, data } = compData;
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
		if (format !== undefined) {
			updates.push('format = ?');
			values.push(format);
		}
		if (data !== undefined) {
			updates.push('data = ?');
			values.push(data);
		}

		if (updates.length === 0) {
			return this.getById(id);
		}

		updates.push('updated_at = CURRENT_TIMESTAMP');
		values.push(id);
		await this.db.run(`UPDATE comps SET ${updates.join(', ')} WHERE id = ?`, values);
		return this.getById(id);
	}

	async upsertByKey(key, compData) {
		const existing = await this.getByKey(key);
		const { type, format = 'json', data } = compData;

		if (existing) {
			await this.db.run(
				'UPDATE comps SET type = ?, format = ?, data = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?',
				[type, format, data, key]
			);
			return this.getByKey(key);
		}

		return this.create({ key, type, format, data });
	}

	async delete(id) {
		await this.db.run('DELETE FROM comps WHERE id = ?', [id]);
	}
}

export default Comp;
