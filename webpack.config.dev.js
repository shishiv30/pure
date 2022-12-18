const baseConfig = require('./webpack.config.base.js');
const { merge } = require('webpack-merge');

module.exports = (env) => {
	var config = baseConfig(env);
	return merge(config, {
		mode: 'development',
		devtool: 'source-map',
	});
};
