import express from 'express';
import User from '../models/User.js';

const router = express.Router();

router.post('/login', async (req, res) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({
				code: 400,
				message: 'Email and password are required',
				data: null
			});
		}

		const userModel = new User(req.app.locals.db.getDb());
		const user = await userModel.verifyPassword(email, password);

		if (!user) {
			return res.status(401).json({
				code: 401,
				message: 'Invalid email or password',
				data: null
			});
		}

		// Set session
		req.session.userId = user.id;
		req.session.email = user.email;
		req.session.role = user.role;
		req.session.name = user.name;

		// Ensure cookie secure flag is set correctly for HTTPS (behind ALB proxy)
		if (req.session.cookie && req.secure) {
			req.session.cookie.secure = true;
		}

		// Explicitly save session to ensure cookie is set correctly
		req.session.save((err) => {
			if (err) {
				console.error('Error saving session during login:', err);
				return res.status(500).json({
					code: 500,
					message: 'Failed to create session',
					data: null
				});
			}

			res.json({
				code: 200,
				message: 'Login successful',
				data: {
					user: {
						id: user.id,
						email: user.email,
						name: user.name,
						role: user.role
					}
				}
			});
		});
	} catch (error) {
		console.error('Login error:', error);
		res.status(500).json({
			code: 500,
			message: 'Internal server error',
			data: null
		});
	}
});

router.post('/logout', (req, res) => {
	req.session.destroy((err) => {
		if (err) {
			return res.status(500).json({
				code: 500,
				message: 'Logout failed',
				data: null
			});
		}
		res.json({
			code: 200,
			message: 'Logout successful',
			data: null
		});
	});
});

router.get('/me', (req, res) => {
	if (!req.session || !req.session.userId) {
		return res.status(401).json({
			code: 401,
			message: 'Not authenticated',
			data: null
		});
	}

	res.json({
		code: 200,
		message: 'User info retrieved',
		data: {
			user: {
				id: req.session.userId,
				email: req.session.email,
				name: req.session.name,
				role: req.session.role
			}
		}
	});
});

export default router;
