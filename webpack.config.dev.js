import baseConfig from './webpack.config.base.js';
import { merge } from 'webpack-merge';

export default (env) => {
	var config = baseConfig(env);
	return merge(config, {
		mode: 'development',
		devtool: 'source-map',
		stats: { warnings: false },
		devServer: {
			port: 8080,
			hot: true,
			liveReload: true,
			watchFiles: ['client/**/*'],
			open: true,
			historyApiFallback: true,
			compress: true,
			client: {
				overlay: {
					errors: true,
					warnings: false,
				},
			},
		},
	});
};
