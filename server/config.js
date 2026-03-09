import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine environment: development | stage (GitHub) | production (AWS)
const NODE_ENV = process.env.NODE_ENV || 'development';

// Env loading: npm run dev → .env then .env.local overwrites; build:stage → .env.stage; build:prod → .env.production
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
	geoareaApiDomain: (process.env.GEOAREA_API_DOMAIN || '').replace(/\/$/, ''),
	geoareaApiKey: process.env.SOA_API_KEY || '',
	/** Property SOA API. Auth: X-MData-Key = SOA_API_KEY. */
	propertyApiDomain: (process.env.PROPERTY_API_DOMAIN || '').replace(/\/$/, ''),
	/** School SOA API. Auth: X-MData-Key = SOA_API_KEY. */
	schoolApiDomain: (process.env.SCHOOL_API_DOMAIN || '').replace(/\/$/, ''),
	/** User SOA API. Auth: X-MData-Key = SOA_API_KEY. */
	userApiDomain: (process.env.USER_API_DOMAIN || '').replace(/\/$/, ''),
	/** POI SOA API. Auth: X-MData-Key = SOA_API_KEY. */
	poiApiDomain: (process.env.POI_API_DOMAIN || '').replace(/\/$/, ''),
	cmsUrl: (process.env.CMS_HOST || '').replace(/\/$/, ''),
	/** Set by cmsData utility: true = use CMS API, false = use local data/ only. Undefined until first use. */
	cmsHealth: undefined,

	// Build Configuration
	webpackMode: process.env.WEBPACK_MODE || NODE_ENV,
	webpackDevtool:
		process.env.WEBPACK_DEVTOOL || (NODE_ENV === 'development' ? 'source-map' : undefined),
	webpackStats:
		process.env.WEBPACK_STATS || (NODE_ENV === 'development' ? 'minimal' : 'errors-only'),

	// App
	appName: process.env.APP_NAME || 'Pure',

	// Host: when CDN_HOST unset, fall back to appHost (so assets follow the same origin/port as links).
	// Docker sets CDN_HOST/APP_HOST in run-docker.sh.
	appHost:
		process.env.APP_HOST ||
		`http://${process.env.DOMAIN || 'localhost'}:${process.env.PORT || 3000}`,
	cdnHost:
		process.env.CDN_HOST ||
		process.env.APP_HOST ||
		`http://${process.env.DOMAIN || 'localhost'}:${process.env.PORT || 3000}`,
	webpackDevServerUrl: `http://${process.env.WEBPACK_DEV_SERVER_HOST}:${process.env.WEBPACK_DEV_SERVER_PORT}`,

	// Development Configuration
	webpackDevServerPort: parseInt(process.env.WEBPACK_DEV_SERVER_PORT) || 3001,
	webpackDevServerHost: process.env.WEBPACK_DEV_SERVER_HOST || 'localhost',
	webpackHotReload: process.env.WEBPACK_HOT_RELOAD === 'true' || NODE_ENV === 'development',

	// Docker only: host-mapped port for CORS when running in container (run-docker.sh sets CDN_HOST)
	dockerPort:
		process.env.CDN_HOST ? (parseInt(process.env.DOCKER_PORT) || 3002) : undefined,

	// Production Configuration (production and stage use minified builds)
	webpackMinimize:
		process.env.WEBPACK_MINIMIZE === 'true' ||
		NODE_ENV === 'production' ||
		NODE_ENV === 'stage',
	webpackOptimize:
		process.env.WEBPACK_OPTIMIZE === 'true' ||
		NODE_ENV === 'production' ||
		NODE_ENV === 'stage',

	/** Production only: optional (path, html) => Promise to upload static HTML to CDN after save to dist */
	uploadStaticHtml: null,
	/** S3 bucket for CDN (AWS_S3_CDN_BUCKET or S3_CDN_BUCKET). When set in production, uploadStaticHtml uses S3. */
	s3CdnBucket: process.env.AWS_S3_CDN_BUCKET || process.env.S3_CDN_BUCKET || '',
};

// Derived URLs (dockerPort only when CDN_HOST set, i.e. Docker run)
config.corsOrigins = [
	config.appHost,
	config.webpackDevServerUrl,
	...(config.dockerPort ? [`http://${config.domain || 'localhost'}:${config.dockerPort}`] : []),
];

// Debug: APP_HOST and CDN_HOST (remove when done)
console.log('[config] env APP_HOST:', process.env.APP_HOST ?? '(unset)');
console.log('[config] env CDN_HOST:', process.env.CDN_HOST ?? '(unset)');
console.log('[config] resolved appHost:', config.appHost);
console.log('[config] resolved cdnHost:', config.cdnHost);

export default config;
