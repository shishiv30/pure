import express from 'express';
import compression from 'compression';
import pageRouter from './routes/page.js';
import apiRouter from './routes/api.js';
import session from './middleware/session.js';
import geo from './middleware/geo.js';
import config from './config.js';

import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swaggerConfig.js';

const app = express();
/* swagger */
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/* middle ware*/
app.use(compression());
session(app);
geo(app);
app.use((req, res, next) => {
	res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
	next();
});

/* routes */
app.use('/', pageRouter);
app.use('/api', apiRouter);
app.use(express.static('dist'));

app.listen(config.port, function () {
	console.log(`Example app listening on port ${config.appUrl}`);
	console.log(`API docs available at ${config.appUrl}/api-docs`);
});
