import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine environment: development | stage (GitHub) | production (AWS)
const NODE_ENV = process.env.NODE_ENV || 'development';

// Load environment variables based on NODE_ENV (override: false so Docker/shell env wins)
if (NODE_ENV === 'production') {
	dotenv.config({ path: path.join(__dirname, '../.env.production'), override: false });
} else if (NODE_ENV === 'stage') {
	dotenv.config({ path: path.join(__dirname, '../.env.stage'), override: false });
} else {
	dotenv.config({ path: path.join(__dirname, '../.env'), override: false });
	dotenv.config({ path: path.join(__dirname, '../.env.local'), override: true });
}

let config = {
	// Server Configuration
	sessionSecret: process.env.SESSION_SECRET || '',
	port: parseInt(process.env.PORT) || 3000,
	domain: process.env.DOMAIN,
	mode: NODE_ENV,

	// API Configuration
	soaApiDomain: process.env.SOA_API_DOMAIN || '',

	// Build Configuration
	webpackMode: process.env.WEBPACK_MODE || NODE_ENV,
	webpackDevtool:
		process.env.WEBPACK_DEVTOOL || (NODE_ENV === 'development' ? 'source-map' : undefined),
	webpackStats:
		process.env.WEBPACK_STATS || (NODE_ENV === 'development' ? 'minimal' : 'errors-only'),

	// App
	appName: process.env.APP_NAME || 'Pure',

	// CDN Configuration
	cdnUrl: process.env.CDN_URL || `http://${process.env.DOMAIN}:${process.env.PORT}`,
	appUrl: process.env.APP_URL || `http://${process.env.DOMAIN}:${process.env.PORT}`,
	webpackDevServerUrl: `http://${process.env.WEBPACK_DEV_SERVER_HOST}:${process.env.WEBPACK_DEV_SERVER_PORT}`,

	// Development Configuration
	webpackDevServerPort: parseInt(process.env.WEBPACK_DEV_SERVER_PORT) || 3001,
	webpackDevServerHost: process.env.WEBPACK_DEV_SERVER_HOST || 'localhost',
	webpackHotReload: process.env.WEBPACK_HOT_RELOAD === 'true' || NODE_ENV === 'development',

	// Docker / host port (from .env DOCKER_PORT, e.g. 3002)
	dockerPort: parseInt(process.env.DOCKER_PORT) || 3002,

	// Production Configuration (production and stage use minified builds)
	webpackMinimize:
		process.env.WEBPACK_MINIMIZE === 'true' ||
		NODE_ENV === 'production' ||
		NODE_ENV === 'stage',
	webpackOptimize:
		process.env.WEBPACK_OPTIMIZE === 'true' ||
		NODE_ENV === 'production' ||
		NODE_ENV === 'stage',
};

// Derived URLs
config.corsOrigins = [
	config.appUrl,
	config.webpackDevServerUrl,
	...(config.dockerPort ? [`http://${config.domain}:${config.dockerPort}`] : []),
];

// console.table({
// 	mode: config.mode,
// 	port: config.port,
// 	domain: config.domain,
// 	soaApiDomain: config.soaApiDomain,
// 	webpackDevServerPort: config.webpackDevServerPort,
// });

export default config;
