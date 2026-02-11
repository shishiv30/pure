import express from 'express';
import User from '../models/User.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Only admins can access user routes
router.get('/', requireAdmin, async (req, res) => {
	try {
		const userModel = new User(req.app.locals.db.getDb());
		const users = await userModel.getAll();

		res.json({
			code: 200,
			message: 'Users retrieved',
			data: users
		});
	} catch (error) {
		console.error('Get users error:', error);
		res.status(500).json({
			code: 500,
			message: 'Internal server error',
			data: null
		});
	}
});

router.get('/:id', requireAdmin, async (req, res) => {
	try {
		const userModel = new User(req.app.locals.db.getDb());
		const user = await userModel.getById(req.params.id);

		if (!user) {
			return res.status(404).json({
				code: 404,
				message: 'User not found',
				data: null
			});
		}

		res.json({
			code: 200,
			message: 'User retrieved',
			data: user
		});
	} catch (error) {
		console.error('Get user error:', error);
		res.status(500).json({
			code: 500,
			message: 'Internal server error',
			data: null
		});
	}
});

router.post('/', requireAdmin, async (req, res) => {
	try {
		const { email, name, password, phone, role = 'user' } = req.body;

		if (!email || !name || !password) {
			return res.status(400).json({
				code: 400,
				message: 'Email, name, and password are required',
				data: null
			});
		}

		const userModel = new User(req.app.locals.db.getDb());
		const user = await userModel.create({
			email,
			name,
			password,
			phone,
			role
		});

		res.status(201).json({
			code: 201,
			message: 'User created successfully',
			data: user
		});
	} catch (error) {
		console.error('Create user error:', error);
		if (error.message && error.message.includes('UNIQUE constraint')) {
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

router.put('/:id', requireAdmin, async (req, res) => {
	try {
		const userModel = new User(req.app.locals.db.getDb());
		const user = await userModel.update(req.params.id, req.body);

		if (!user) {
			return res.status(404).json({
				code: 404,
				message: 'User not found',
				data: null
			});
		}

		res.json({
			code: 200,
			message: 'User updated successfully',
			data: user
		});
	} catch (error) {
		console.error('Update user error:', error);
		res.status(500).json({
			code: 500,
			message: 'Internal server error',
			data: null
		});
	}
});

router.delete('/:id', requireAdmin, async (req, res) => {
	try {
		// Prevent deleting yourself
		if (parseInt(req.params.id) === req.session.userId) {
			return res.status(400).json({
				code: 400,
				message: 'Cannot delete your own account',
				data: null
			});
		}

		const userModel = new User(req.app.locals.db.getDb());
		await userModel.delete(req.params.id);

		res.json({
			code: 200,
			message: 'User deleted successfully',
			data: null
		});
	} catch (error) {
		console.error('Delete user error:', error);
		res.status(500).json({
			code: 500,
			message: 'Internal server error',
			data: null
		});
	}
});

export default router;
