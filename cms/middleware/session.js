import session from 'express-session';

export default function setupSession(app, sessionSecret) {
	app.use(
		session({
			secret: sessionSecret,
			resave: false,
			saveUninitialized: false,
			cookie: {
				secure: process.env.NODE_ENV === 'production',
				httpOnly: true,
				maxAge: 24 * 60 * 60 * 1000 // 24 hours
			}
		})
	);
}
