import express from 'express';
import Page from '../models/Page.js';
import { requireAuth, requireAdmin, requireReadAccess } from '../middleware/auth.js';

const router = express.Router();

function normalizeMeta(meta) {
	if (meta == null) return null;
	if (typeof meta === 'object') {
		try {
			return JSON.stringify(meta);
		} catch {
			return String(meta);
		}
	}
	return String(meta);
}

function normalizeType(type) {
	if (!type) return 'html';
	const val = String(type).toLowerCase().trim();
	return val === 'json' ? 'json' : 'html';
}

function parseMeta(meta) {
	if (meta == null) return null;
	if (typeof meta !== 'string') return meta;
	try {
		return JSON.parse(meta);
	} catch {
		return meta;
	}
}

// Shared handler for public page content by name
async function getPageContentByName(req, res) {
	try {
		const pageModel = new Page(req.app.locals.db.getDb());
		const page = await pageModel.getByName(req.params.name);

		if (!page) {
			return res.status(404).json({
				code: 404,
				message: 'Page not found',
				data: null
			});
		}

		if (page.status !== 'published') {
			return res.status(404).json({
				code: 404,
				message: 'Page not found',
				data: null
			});
		}

		res.json({
			code: 200,
			message: 'Page content retrieved',
			data: {
				name: page.name,
				title: page.title,
				data: page.data,
				type: page.type,
				meta: parseMeta(page.meta),
			}
		});
	} catch (error) {
		console.error('Get page content error:', error);
		res.status(500).json({
			code: 500,
			message: 'Internal server error',
			data: null
		});
	}
}

// Public API: Get page content by name (used by main server fetch)
router.get('/content/:name', getPageContentByName);

// Public API: Get page content by name (alternate path)
router.get('/page/:name', getPageContentByName);

// Alias for getPageContentByName
router.get('/getPageContentByName', async (req, res) => {
	try {
		const { name } = req.query;
		if (!name) {
			return res.status(400).json({
				code: 400,
				message: 'Page name is required',
				data: null
			});
		}

		const pageModel = new Page(req.app.locals.db.getDb());
		const page = await pageModel.getByName(name);

		if (!page) {
			return res.status(404).json({
				code: 404,
				message: 'Page not found',
				data: null
			});
		}

		if (page.status !== 'published') {
			return res.status(404).json({
				code: 404,
				message: 'Page not found',
				data: null
			});
		}

		res.json({
			code: 200,
			message: 'Page content retrieved',
			data: {
				name: page.name,
				title: page.title,
				data: page.data,
				type: page.type,
				meta: parseMeta(page.meta),
			}
		});
	} catch (error) {
		console.error('Get page content error:', error);
		res.status(500).json({
			code: 500,
			message: 'Internal server error',
			data: null
		});
	}
});

// Admin/User routes - require authentication
router.get('/', requireReadAccess, async (req, res) => {
	try {
		const pageModel = new Page(req.app.locals.db.getDb());
		const pages = req.session.role === 'admin'
			? await pageModel.getAll()
			: await pageModel.getPublished();

		res.json({
			code: 200,
			message: 'Pages retrieved',
			data: pages
		});
	} catch (error) {
		console.error('Get pages error:', error);
		res.status(500).json({
			code: 500,
			message: 'Internal server error',
			data: null
		});
	}
});

router.get('/:id', requireReadAccess, async (req, res) => {
	try {
		const pageModel = new Page(req.app.locals.db.getDb());
		const page = await pageModel.getById(req.params.id);

		if (!page) {
			return res.status(404).json({
				code: 404,
				message: 'Page not found',
				data: null
			});
		}

		// Users can only see published pages
		if (req.session.role !== 'admin' && page.status !== 'published') {
			return res.status(404).json({
				code: 404,
				message: 'Page not found',
				data: null
			});
		}

		res.json({
			code: 200,
			message: 'Page retrieved',
			data: page
		});
	} catch (error) {
		console.error('Get page error:', error);
		res.status(500).json({
			code: 500,
			message: 'Internal server error',
			data: null
		});
	}
});

router.post('/', requireAdmin, async (req, res) => {
	try {
		const { name, path, title, data, type, meta, status } = req.body;

		if (!name || !title) {
			return res.status(400).json({
				code: 400,
				message: 'Name and title are required',
				data: null
			});
		}

		const pageModel = new Page(req.app.locals.db.getDb());
		const page = await pageModel.create({
			name,
			path: path || null,
			title,
			data,
			type: normalizeType(type),
			meta: normalizeMeta(meta),
			status: status || 'draft',
			created_by: req.session.userId
		});

		res.status(201).json({
			code: 201,
			message: 'Page created successfully',
			data: page
		});
	} catch (error) {
		console.error('Create page error:', error);
		if (error.message && error.message.includes('UNIQUE constraint')) {
			return res.status(400).json({
				code: 400,
				message: 'Page name already exists',
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
		const pageModel = new Page(req.app.locals.db.getDb());
		const body = {
			...req.body,
		};
		if (body.name !== undefined) body.name = String(body.name).trim() || undefined;
		if (body.type !== undefined) body.type = normalizeType(body.type);
		if (body.meta !== undefined) body.meta = normalizeMeta(body.meta);
		const page = await pageModel.update(req.params.id, body, req.session.userId);

		if (!page) {
			return res.status(404).json({
				code: 404,
				message: 'Page not found',
				data: null
			});
		}

		res.json({
			code: 200,
			message: 'Page updated successfully',
			data: page
		});
	} catch (error) {
		console.error('Update page error:', error);
		if (error.message && error.message.includes('UNIQUE constraint')) {
			return res.status(400).json({
				code: 400,
				message: 'Page name already exists',
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

router.delete('/:id', requireAdmin, async (req, res) => {
	try {
		const pageModel = new Page(req.app.locals.db.getDb());
		await pageModel.delete(req.params.id);

		res.json({
			code: 200,
			message: 'Page deleted successfully',
			data: null
		});
	} catch (error) {
		console.error('Delete page error:', error);
		res.status(500).json({
			code: 500,
			message: 'Internal server error',
			data: null
		});
	}
});

export default router;
