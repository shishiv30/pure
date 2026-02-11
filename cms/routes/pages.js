import express from 'express';
import Page from '../models/Page.js';
import { requireAuth, requireAdmin, requireReadAccess } from '../middleware/auth.js';

const router = express.Router();

// Public API: Get page content by name
router.get('/content/:name', async (req, res) => {
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
				content: page.content,
				meta_description: page.meta_description,
				meta_keywords: page.meta_keywords
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
				content: page.content,
				meta_description: page.meta_description,
				meta_keywords: page.meta_keywords
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
		const { name, title, content, meta_description, meta_keywords, status } = req.body;

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
			title,
			content,
			meta_description,
			meta_keywords,
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
		const page = await pageModel.update(req.params.id, req.body, req.session.userId);

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
