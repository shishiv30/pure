import session from 'express-session';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export default function setupSession(app, sessionSecret, dbPath) {
	const isProduction = process.env.NODE_ENV === 'production';
	// Allow explicit override via environment variable for proxy scenarios
	const forceSecure = process.env.SESSION_COOKIE_SECURE !== undefined
		? process.env.SESSION_COOKIE_SECURE === 'true'
		: isProduction;

	let store;
	if (dbPath) {
		// Persistent store so sessions survive restarts and work across ECS tasks (same EFS volume)
		const connectSqlite3 = require('connect-sqlite3');
		const SQLiteStore = connectSqlite3(session);
		const dir = path.dirname(dbPath);
		store = new SQLiteStore({
			dir,
			db: 'sessions.db',
			createDirIfNotExists: true
		});
	}

	app.use(
		session({
			secret: sessionSecret,
			store,
			resave: false,
			saveUninitialized: false,
			// Use a function to dynamically set cookie secure flag based on req.secure
			// This ensures cookies work correctly behind HTTPS-terminating ALB proxy
			// With trust proxy set, Express detects HTTPS via X-Forwarded-Proto header
			cookie: (req) => ({
				secure: forceSecure ? true : (req.secure || false),
				httpOnly: true,
				sameSite: 'lax',
				maxAge: 24 * 60 * 60 * 1000 // 24 hours
			})
		})
	);
}
