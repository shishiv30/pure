import bcrypt from 'bcrypt';

class User {
	constructor(db) {
		this.db = db;
	}

	async create(userData) {
		const { email, name, password, phone, role = 'user' } = userData;
		const hashedPassword = await bcrypt.hash(password, 10);

		const result = await this.db.run(
			`INSERT INTO users (email, name, password, phone, role) 
			 VALUES (?, ?, ?, ?, ?)`,
			[email, name, hashedPassword, phone || null, role]
		);

		return this.getById(result.lastID);
	}

	async getById(id) {
		return await this.db.get('SELECT id, email, name, phone, role, created_at, updated_at FROM users WHERE id = ?', [id]);
	}

	async getByEmail(email) {
		return await this.db.get('SELECT * FROM users WHERE email = ?', [email]);
	}

	async getAll() {
		return await this.db.all('SELECT id, email, name, phone, role, created_at, updated_at FROM users ORDER BY created_at DESC');
	}

	async update(id, userData) {
		const { name, phone, role } = userData;
		const updates = [];
		const values = [];

		if (name !== undefined) {
			updates.push('name = ?');
			values.push(name);
		}
		if (phone !== undefined) {
			updates.push('phone = ?');
			values.push(phone);
		}
		if (role !== undefined) {
			updates.push('role = ?');
			values.push(role);
		}

		if (updates.length === 0) {
			return this.getById(id);
		}

		updates.push('updated_at = CURRENT_TIMESTAMP');
		values.push(id);

		await this.db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
		return this.getById(id);
	}

	async updatePassword(id, newPassword) {
		const hashedPassword = await bcrypt.hash(newPassword, 10);
		await this.db.run('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [hashedPassword, id]);
		return this.getById(id);
	}

	async delete(id) {
		await this.db.run('DELETE FROM users WHERE id = ?', [id]);
	}

	async verifyPassword(email, password) {
		const user = await this.getByEmail(email);
		if (!user) {
			return null;
		}

		const isValid = await bcrypt.compare(password, user.password);
		return isValid ? user : null;
	}

	async hasAdmin() {
		const admin = await this.db.get("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
		return admin.count > 0;
	}
}

export default User;
