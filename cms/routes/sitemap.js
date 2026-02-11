import express from 'express';
import Sitemap from '../models/Sitemap.js';
import { requireAuth, requireAdmin, requireReadAccess } from '../middleware/auth.js';

const router = express.Router();

// Public API: Get active sitemap entries
router.get('/public', async (req, res) => {
	try {
		const sitemapModel = new Sitemap(req.app.locals.db.getDb());
		const entries = await sitemapModel.getActive();

		res.json({
			code: 200,
			message: 'Sitemap retrieved',
			data: entries
		});
	} catch (error) {
		console.error('Get sitemap error:', error);
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
		const sitemapModel = new Sitemap(req.app.locals.db.getDb());
		const entries = req.session.role === 'admin' 
			? await sitemapModel.getAll() 
			: await sitemapModel.getActive();

		res.json({
			code: 200,
			message: 'Sitemap retrieved',
			data: entries
		});
	} catch (error) {
		console.error('Get sitemap error:', error);
		res.status(500).json({
			code: 500,
			message: 'Internal server error',
			data: null
		});
	}
});

router.get('/:id', requireReadAccess, async (req, res) => {
	try {
		const sitemapModel = new Sitemap(req.app.locals.db.getDb());
		const entry = await sitemapModel.getById(req.params.id);

		if (!entry) {
			return res.status(404).json({
				code: 404,
				message: 'Sitemap entry not found',
				data: null
			});
		}

		// Users can only see active entries
		if (req.session.role !== 'admin' && entry.status !== 'active') {
			return res.status(404).json({
				code: 404,
				message: 'Sitemap entry not found',
				data: null
			});
		}

		res.json({
			code: 200,
			message: 'Sitemap entry retrieved',
			data: entry
		});
	} catch (error) {
		console.error('Get sitemap entry error:', error);
		res.status(500).json({
			code: 500,
			message: 'Internal server error',
			data: null
		});
	}
});

router.post('/', requireAdmin, async (req, res) => {
	try {
		const { url, priority, changefreq, lastmod, status } = req.body;

		if (!url) {
			return res.status(400).json({
				code: 400,
				message: 'URL is required',
				data: null
			});
		}

		const sitemapModel = new Sitemap(req.app.locals.db.getDb());
		const entry = await sitemapModel.create({
			url,
			priority,
			changefreq,
			lastmod,
			status: status || 'active'
		});

		res.status(201).json({
			code: 201,
			message: 'Sitemap entry created successfully',
			data: entry
		});
	} catch (error) {
		console.error('Create sitemap entry error:', error);
		res.status(500).json({
			code: 500,
			message: 'Internal server error',
			data: null
		});
	}
});

router.put('/:id', requireAdmin, async (req, res) => {
	try {
		const sitemapModel = new Sitemap(req.app.locals.db.getDb());
		const entry = await sitemapModel.update(req.params.id, req.body);

		if (!entry) {
			return res.status(404).json({
				code: 404,
				message: 'Sitemap entry not found',
				data: null
			});
		}

		res.json({
			code: 200,
			message: 'Sitemap entry updated successfully',
			data: entry
		});
	} catch (error) {
		console.error('Update sitemap entry error:', error);
		res.status(500).json({
			code: 500,
			message: 'Internal server error',
			data: null
		});
	}
});

router.delete('/:id', requireAdmin, async (req, res) => {
	try {
		const sitemapModel = new Sitemap(req.app.locals.db.getDb());
		await sitemapModel.delete(req.params.id);

		res.json({
			code: 200,
			message: 'Sitemap entry deleted successfully',
			data: null
		});
	} catch (error) {
		console.error('Delete sitemap entry error:', error);
		res.status(500).json({
			code: 500,
			message: 'Internal server error',
			data: null
		});
	}
});

export default router;
