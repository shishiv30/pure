import express from 'express';
import compression from 'compression';
import router from './routes/index.js';
import session from './middleware/session.js';
import geo from './middleware/geo.js';
import llms from './middleware/llms.js';
import agentLog from './middleware/agentLog.js';
import config from './config.js';
import { uploadStaticHtmlToS3 } from './utils/uploadStaticHtmlS3.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { useCms } from './utils/cmsData.js';
import cors from 'cors';
import { runWithSoaLogs } from './controllers/realestate.js';

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

/* log AI agent / crawler requests (docker logs pure | grep '\[agent\]') */
app.use(agentLog);

/* llms.txt on/off switch (before static, so it can hide dist/llms.txt) */
app.use(llms);

app.use((req, res, next) => {
	runWithSoaLogs(() => next());
});

/* routes: static first so /page/index.html serves saved HTML; then dynamic routes */
app.use(cors({ origin: config.corsOrigins }));
app.use(express.static('dist', { redirect: false }));
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
		console.log(`Listing pages available at state like ${config.appHost}/property/tx`);
		console.log(`About page available at ${config.appHost}/about`);
	});
})();
