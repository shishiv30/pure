import express from 'express';
import Comp from '../models/Comp.js';
import { requireAuth, requireAdmin, requireReadAccess } from '../middleware/auth.js';

const router = express.Router();

// Public: get one comp by key (e.g. header for site header)
router.get('/public/:key', async (req, res) => {
	try {
		const compModel = new Comp(req.app.locals.db.getDb());
		const row = await compModel.getByKey(req.params.key);

		if (!row) {
			return res.status(404).json({
				code: 404,
				message: 'Comp not found',
				data: null
			});
		}

		res.json({
			code: 200,
			message: 'Comp retrieved',
			data: row
		});
	} catch (error) {
		console.error('Get comp by key error:', error);
		res.status(500).json({
			code: 500,
			message: 'Internal server error',
			data: null
		});
	}
});

router.get('/', requireReadAccess, async (req, res) => {
	try {
		const compModel = new Comp(req.app.locals.db.getDb());
		const rows = await compModel.getAll();

		res.json({
			code: 200,
			message: 'Comp list retrieved',
			data: rows
		});
	} catch (error) {
		console.error('Get comp list error:', error);
		res.status(500).json({
			code: 500,
			message: 'Internal server error',
			data: null
		});
	}
});

router.get('/by-id/:id', requireReadAccess, async (req, res) => {
	try {
		const compModel = new Comp(req.app.locals.db.getDb());
		const row = await compModel.getById(req.params.id);

		if (!row) {
			return res.status(404).json({
				code: 404,
				message: 'Comp not found',
				data: null
			});
		}

		res.json({
			code: 200,
			message: 'Comp retrieved',
			data: row
		});
	} catch (error) {
		console.error('Get comp by id error:', error);
		res.status(500).json({
			code: 500,
			message: 'Internal server error',
			data: null
		});
	}
});

router.get('/:key', requireReadAccess, async (req, res) => {
	try {
		const compModel = new Comp(req.app.locals.db.getDb());
		const row = await compModel.getByKey(req.params.key);

		if (!row) {
			return res.status(404).json({
				code: 404,
				message: 'Comp not found',
				data: null
			});
		}

		res.json({
			code: 200,
			message: 'Comp retrieved',
			data: row
		});
	} catch (error) {
		console.error('Get comp error:', error);
		res.status(500).json({
			code: 500,
			message: 'Internal server error',
			data: null
		});
	}
});

router.post('/', requireAdmin, async (req, res) => {
	try {
		const { key, type, data } = req.body;

		if (!key || type == null || data == null) {
			return res.status(400).json({
				code: 400,
				message: 'key, type, and data are required',
				data: null
			});
		}

		const compModel = new Comp(req.app.locals.db.getDb());
		const existing = await compModel.getByKey(key);
		const payload = { key, type, data: typeof data === 'string' ? data : JSON.stringify(data) };

		const row = existing
			? await compModel.update(existing.id, payload)
			: await compModel.create(payload);

		res.status(existing ? 200 : 201).json({
			code: existing ? 200 : 201,
			message: existing ? 'Comp updated' : 'Comp created',
			data: row
		});
	} catch (error) {
		console.error('Post comp error:', error);
		res.status(500).json({
			code: 500,
			message: 'Internal server error',
			data: null
		});
	}
});

router.put('/:id', requireAdmin, async (req, res) => {
	try {
		const { key, type, data } = req.body;
		const compModel = new Comp(req.app.locals.db.getDb());
		const existing = await compModel.getById(req.params.id);

		if (!existing) {
			return res.status(404).json({
				code: 404,
				message: 'Comp not found',
				data: null
			});
		}

		const payload = {};
		if (key !== undefined) payload.key = key;
		if (type !== undefined) payload.type = type;
		if (data !== undefined) payload.data = typeof data === 'string' ? data : JSON.stringify(data);

		const row = await compModel.update(req.params.id, payload);

		res.json({
			code: 200,
			message: 'Comp updated',
			data: row
		});
	} catch (error) {
		console.error('Update comp error:', error);
		res.status(500).json({
			code: 500,
			message: 'Internal server error',
			data: null
		});
	}
});

router.delete('/:id', requireAdmin, async (req, res) => {
	try {
		const compModel = new Comp(req.app.locals.db.getDb());
		const existing = await compModel.getById(req.params.id);

		if (!existing) {
			return res.status(404).json({
				code: 404,
				message: 'Comp not found',
				data: null
			});
		}

		await compModel.delete(req.params.id);

		res.json({
			code: 200,
			message: 'Comp deleted',
			data: null
		});
	} catch (error) {
		console.error('Delete comp error:', error);
		res.status(500).json({
			code: 500,
			message: 'Internal server error',
			data: null
		});
	}
});

export default router;
