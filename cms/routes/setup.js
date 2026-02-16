import express from 'express';
import User from '../models/User.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/status', async (req, res) => {
	try {
		const userModel = new User(req.app.locals.db.getDb());
		const hasAdmin = await userModel.hasAdmin();

		res.json({
			code: 200,
			message: 'Setup status retrieved',
			data: {
				setupComplete: hasAdmin
			}
		});
	} catch (error) {
		console.error('Setup status error:', error);
		res.status(500).json({
			code: 500,
			message: 'Internal server error',
			data: null
		});
	}
});

router.post('/create-admin', async (req, res) => {
	try {
		const userModel = new User(req.app.locals.db.getDb());
		const hasAdmin = await userModel.hasAdmin();

		if (hasAdmin) {
			return res.status(400).json({
				code: 400,
				message: 'Admin user already exists',
				data: null
			});
		}

		const { email, name, password, phone } = req.body;

		if (!email || !name || !password) {
			return res.status(400).json({
				code: 400,
				message: 'Email, name, and password are required',
				data: null
			});
		}

		const admin = await userModel.create({
			email,
			name,
			password,
			phone,
			role: 'admin'
		});

		// Auto-login the admin
		req.session.userId = admin.id;
		req.session.email = admin.email;
		req.session.role = admin.role;
		req.session.name = admin.name;

		res.status(201).json({
			code: 201,
			message: 'Admin user created successfully',
			data: {
				user: {
					id: admin.id,
					email: admin.email,
					name: admin.name,
					role: admin.role
				}
			}
		});
	} catch (error) {
		console.error('Create admin error:', error);
		if (error.message.includes('UNIQUE constraint')) {
			return res.status(400).json({
				code: 400,
				message: 'Email already exists',
				data: null
			});
		}
		res.status(500).json({
			code: 500,
			message: 'Internal server error',
			data: null
		});
	}
});

// One-time migration: add path column to pages (for DBs created before path was added)
router.post('/migrate-pages-path', requireAdmin, async (req, res) => {
	try {
		const db = req.app.locals.db.getDb();
		const columns = await db.all('PRAGMA table_info(pages)');
		const hasPath = columns && columns.some((c) => c.name === 'path');
		if (hasPath) {
			return res.json({
				code: 200,
				message: 'Column pages.path already exists',
				data: { migrated: false }
			});
		}
		await db.run('ALTER TABLE pages ADD COLUMN path TEXT');
		res.json({
			code: 200,
			message: 'Added pages.path column',
			data: { migrated: true }
		});
	} catch (error) {
		console.error('Migrate pages path error:', error);
		res.status(500).json({
			code: 500,
			message: error.message || 'Internal server error',
			data: null
		});
	}
});

export default router;
