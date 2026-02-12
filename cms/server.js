import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import compression from 'compression';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from './database/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import setupSession from './middleware/session.js';
import { checkSetup } from './middleware/setup.js';
import authRoutes from './routes/auth.js';
import setupRoutes from './routes/setup.js';
import pagesRoutes from './routes/pages.js';
import sitemapRoutes from './routes/sitemap.js';
import usersRoutes from './routes/users.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-this-secret-in-production';
const DB_PATH = process.env.DB_PATH || './data/cms.db';
const CORS_ORIGINS = process.env.CORS_ORIGINS 
	? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
	: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];

// Trust first proxy (ALB) so req.protocol and req.secure are correct for cookies
app.set('trust proxy', 1);

// Middleware
app.use(compression());
app.use(cors({
	origin: CORS_ORIGINS,
	credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session middleware (pass DB_PATH so sessions persist in SQLite on same volume as DB)
setupSession(app, SESSION_SECRET, DB_PATH);

// Initialize database
const db = new Database(DB_PATH);

(async () => {
	try {
		await db.init();
		console.log('Database initialized successfully');

		// Store db instance in app locals
		app.locals.db = db;

		// Setup check middleware (must be after db initialization)
		app.use(checkSetup);

		// Public routes (no auth required)
		app.get('/health', (req, res) => {
			res.json({
				code: 200,
				message: 'CMS API is running',
				data: {
					version: '1.0.0',
					timestamp: new Date().toISOString()
				}
			});
		});

		// Setup routes (for initial admin creation)
		app.use('/api/setup', setupRoutes);

		// Auth routes
		app.use('/api/auth', authRoutes);

		// Serve static files (admin panel)
		app.use(express.static(path.join(__dirname, 'public')));

		// Serve admin panel for root route
		app.get('/', (req, res) => {
			res.sendFile(path.join(__dirname, 'public', 'index.html'));
		});

		// Protected routes
		app.use('/api/pages', pagesRoutes);
		app.use('/api/sitemap', sitemapRoutes);
		app.use('/api/users', usersRoutes);

		// Start server
		app.listen(PORT, () => {
			console.log(`CMS Server running on port ${PORT}`);
			console.log(`Health check: http://localhost:${PORT}/health`);
			console.log(`Database: ${DB_PATH}`);
		});
	} catch (error) {
		console.error('Failed to initialize server:', error);
		process.exit(1);
	}
})();

// Graceful shutdown
process.on('SIGTERM', async () => {
	console.log('SIGTERM signal received: closing HTTP server');
	await db.close();
	process.exit(0);
});

process.on('SIGINT', async () => {
	console.log('SIGINT signal received: closing HTTP server');
	await db.close();
	process.exit(0);
});

export default app;
