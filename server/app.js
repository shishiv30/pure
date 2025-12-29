import express from 'express';
import compression from 'compression';
import pageRouter from './routes/page.js';
import apiRouter from './routes/api.js';
import session from './middleware/session.js';
import geo from './middleware/geo.js';
import config from './config.js';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swaggerConfig.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.set('views', path.join(__dirname, './ejs'));
app.set('view engine', 'ejs');
// app.set('view options', { rmWhitespace: true });

/* swagger */
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/* middle ware*/
app.use(compression());
session(app);

app.use((req, res, next) => {
	res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
	next();
});

/* routes */
app.use(
	cors({
		origin: [
			`http://${config.domain}:${config.webpackDevServerPort}`,
			`http://${config.domain}:${config.port}`,
			`http://${config.domain}:3001`,
		],
	}),
);
app.use('/', pageRouter);
app.use('/api', apiRouter);
app.use(express.static('dist'));

// Initialize geo data and start server
(async () => {
	await geo(app);
	app.listen(config.port, function () {
		console.log(`Example app listening on port ${config.appUrl}`);
		console.log(`API docs available at ${config.appUrl}/api-docs`);
		console.log(`Demo docs available at state like ${config.appUrl}/demo/tx`);
		console.log(`About page available at ${config.appUrl}/about`);
	});
})();
