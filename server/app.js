import express from 'express';
import compression from 'compression';
import pageRouter from './router/page.js';
import apiRouter from './router/api.js';
import session from './middleware/session.js';
import geo from './middleware/geo.js';
import config from './config.js';

const app = express();
app.use(compression());

session(app);
geo(app);
app.use((req, res, next) => {
	res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
	next();
});
app.use('/', pageRouter);
app.use('/api', apiRouter);

app.use(express.static('dist'));

app.listen(config.port, function () {
	console.log(`Example app listening on port ${config.appUrl}`);
});
