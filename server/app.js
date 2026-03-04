import express from 'express';
import compression from 'compression';
import router from './routes/index.js';
import session from './middleware/session.js';
import geo from './middleware/geo.js';
import config from './config.js';
import { uploadStaticHtmlToS3 } from './utils/uploadStaticHtmlS3.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { useCms } from './utils/cmsData.js';
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

/* routes: static first so /page/index.html serves saved HTML; then dynamic routes */
app.use(cors({ origin: config.corsOrigins }));
app.use(express.static('dist'));
app.use('/', router);

// Set CMS health before starting server so routes use local vs CMS consistently
(async () => {
	config.cmsHealth = await useCms();
	if (config.mode === 'production' && config.s3CdnBucket) {
		config.uploadStaticHtml = uploadStaticHtmlToS3;
	}
	if (!config.cmsHealth) {
		console.error('CMS is not healthy, use local data only');
	} else {
		console.log('CMS is healthy, use CMS data');
	}
	await geo(app);
	app.listen(config.port, function () {
		console.log(`Example app listening on host ${config.appHost}`);
		console.log(`API docs available at ${config.appHost}/api-docs`);
		console.log(`Demo docs available at state like ${config.appHost}/demo/tx`);
		console.log(`About page available at ${config.appHost}/about`);
	});
})();
