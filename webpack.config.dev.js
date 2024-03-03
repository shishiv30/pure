import baseConfig from './webpack.config.base.js';
import { merge } from 'webpack-merge';

export default (env) => {
	var config = baseConfig(env);
	return merge(config, {
		mode: 'development',
		devtool: 'source-map',
		stats: { warnings: false },
	});
};
