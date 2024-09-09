let config = {
	sessionSecret: 'the session key',
	port: 3000,
	domain: 'localhost',
};

config.appUrl = `http://${config.domain}:${config.port}`;
config.cdnUrl = `http://${config.domain}:${config.port}`;
export default config;
