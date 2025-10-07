import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine environment
const NODE_ENV = process.env.NODE_ENV || 'development';

// Load environment variables based on NODE_ENV
if (NODE_ENV === 'production') {
	dotenv.config({ path: path.join(__dirname, '../.env.production') });
} else {
	dotenv.config({ path: path.join(__dirname, '../.env') });
}

// Also load .env.local if it exists (for local overrides)
dotenv.config({ path: path.join(__dirname, '../.env.local'), override: false });

let config = {
	// Server Configuration
	sessionSecret: process.env.SESSION_SECRET || '',
	port: parseInt(process.env.PORT) || 9999,
	domain: process.env.DOMAIN || '127.0.0.1',
	mode: NODE_ENV,

	// API Configuration
	soaApiDomain: process.env.SOA_API_DOMAIN || '',

	// Build Configuration
	webpackMode: process.env.WEBPACK_MODE || NODE_ENV,
	webpackDevtool:
		process.env.WEBPACK_DEVTOOL || (NODE_ENV === 'development' ? 'source-map' : undefined),
	webpackStats: process.env.WEBPACK_STATS || (NODE_ENV === 'development' ? 'minimal' : 'normal'),

	// CDN Configuration
	cdnUrl: process.env.CDN_URL || '',

	// Development Configuration
	webpackDevServerPort: parseInt(process.env.WEBPACK_DEV_SERVER_PORT) || 8080,
	webpackDevServerHost: process.env.WEBPACK_DEV_SERVER_HOST || 'localhost',
	webpackHotReload: process.env.WEBPACK_HOT_RELOAD === 'true' || NODE_ENV === 'development',

	// Production Configuration
	webpackMinimize: process.env.WEBPACK_MINIMIZE === 'true' || NODE_ENV === 'production',
	webpackOptimize: process.env.WEBPACK_OPTIMIZE === 'true' || NODE_ENV === 'production',
};

// Derived URLs
config.appUrl = `http://${config.domain}:${config.port}`;
config.cdnUrl = config.cdnUrl || config.appUrl;
config.webpackDevServerUrl = `http://${config.webpackDevServerHost}:${config.webpackDevServerPort}`;

console.log('Configuration loaded:', {
	mode: config.mode,
	port: config.port,
	domain: config.domain,
	soaApiDomain: config.soaApiDomain,
	webpackDevServerPort: config.webpackDevServerPort,
});

export default config;
