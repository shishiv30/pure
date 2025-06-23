import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

let config = {
	sessionSecret: 'the session key',
	port: process.env.PORT || 3000,
	domain: process.env.DOMAIN || 'localhost',
	soaApiDomain: process.env.SOA_API_DOMAIN || '',
};

config.appUrl = `http://${config.domain}:${config.port}`;
config.cdnUrl = `http://${config.domain}:${config.port}`;
export default config;
