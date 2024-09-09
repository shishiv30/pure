import session from 'express-session';
export default function (app) {
	const sess = {
		cookie: {},
		secret: 'keybord cat',
		resave: false,
		saveUninitialized: true,
	};
	if (app.get('env') === 'production') {
		app.set('trust proxy', 1); // trust first proxy
		sess.cookie.secure = true; // serve secure cookies
	}

	app.use(session(sess));

	app.use(function (req, res, next) {
		if (!req.session.views) {
			req.session.views = {};
		}

		// get the url pathname
		var pathname = req.path;

		// count the views
		req.session.views[pathname] = (req.session.views[pathname] || 0) + 1;
		next();
	});
}
