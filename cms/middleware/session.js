import session from 'express-session';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export default function setupSession(app, sessionSecret, dbPath) {
	const isProduction = process.env.NODE_ENV === 'production';

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
				secure: isProduction,
				httpOnly: true,
				sameSite: 'lax',
				maxAge: 24 * 60 * 60 * 1000 // 24 hours
			}
		})
	);
}
