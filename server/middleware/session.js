import session from 'express-session';
export default function (app) {
	const sess = {
		cookie: {},
		secret: 'keyboard cat',
		resave: false,
		saveUninitialized: true,
	};
	if (app.get('env') === 'production') {
		app.set('trust proxy', 1); // trust first proxy
		sess.cookie.secure = true; // serve secure cookies
	}

	app.use(session(sess));

	//session middleware of history
	app.use(function (req, res, next) {
		const MAX_VIEW_COUNT = 10;
		if (!req.session.history) {
			req.session.history = [];
		}

		let pathname = req.path;
		//if views more than MAX_VIEW_COUNT
		let views = req.session.history;
		let index = views.findIndex((e) => e.pathname === pathname);
		if (index === -1) {
			if (views.length >= MAX_VIEW_COUNT) {
				views.shift();
			}
			views.push({ pathname: pathname, count: 1 });
		} else {
			//move to index item to end of the queue as it is the most recent
			let temp = views.splice(index, 1)[0];
			temp.count++;
			views.push(temp);
		}
		req.session.history = views;
		if (req.session.viewCount) {
			req.session.viewCount++;
		} else {
			req.session.viewCount = 1;
		}
		if (!req.session.landingPage) {
			req.session.landingPage = req.path;
			req.session.landingUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
		}
		next();
	});
}
