import express from 'express';
import compression from 'compression';
import route from './router/index.js';
import session from './middleware/session.js';
import config from './config.js';
const app = express();

app.use(compression());

session(app);
app.use((req,res,next)=>{
	res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
	next();
});
app.use('/backend', route);

app.use(express.static('dist'));

app.listen(config.port, function () {
	console.log(`Example app listening on port ${config.appUrl}`);
});
