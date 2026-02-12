import session from 'express-session';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export default function setupSession(app, sessionSecret, dbPath) {
	const isProduction = process.env.NODE_ENV === 'production';
	// Allow explicit override via environment variable for proxy scenarios
	const cookieSecure = process.env.SESSION_COOKIE_SECURE !== undefined
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
			cookie: {
				// Set secure flag: true in production (behind HTTPS-terminating ALB)
				// With trust proxy set, Express will correctly detect HTTPS via X-Forwarded-Proto
				secure: cookieSecure,
				httpOnly: true,
				sameSite: 'lax',
				maxAge: 24 * 60 * 60 * 1000 // 24 hours
			}
		})
	);

	// Middleware to ensure session cookie secure flag is correct when behind ALB proxy
	// This fixes cases where the cookie was set before trust proxy properly detected HTTPS
	app.use((req, res, next) => {
		if (req.session && req.session.cookie && isProduction) {
			// If request is secure (via ALB X-Forwarded-Proto header) but cookie secure flag doesn't match,
			// update it and save the session to regenerate the cookie
			if (req.secure && !req.session.cookie.secure) {
				req.session.cookie.secure = true;
				req.session.save((err) => {
					if (err) {
						console.error('Error saving session with updated secure flag:', err);
					}
				});
			}
		}
		next();
	});
}
