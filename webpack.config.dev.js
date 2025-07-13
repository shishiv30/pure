import baseConfig from './webpack.config.base.js';
import { merge } from 'webpack-merge';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (env) => {
	var config = baseConfig(env);
	return merge(config, {
		mode: 'development',
		devtool: 'source-map',
		stats: { warnings: false },
		output: {
			path: path.resolve(__dirname, 'dist'),
			filename: '[name].min.js',
			publicPath: '/',
		},
		devServer: {
			static: {
				directory: path.join(__dirname, 'dist'),
			},
			compress: true,
			port: 8080,
			hot: true,
			watchFiles: ['client/**/*'],
			proxy: [
				{
					context: (pathname) => {
						// Proxy everything except files with extensions
						const hasExtension = /\.[a-zA-Z0-9]+$/.test(pathname);
						const isWebpackAsset =
							pathname.startsWith('/webpack') || pathname.startsWith('/__webpack');

						// Don't proxy files with extensions or webpack dev server assets
						return !hasExtension && !isWebpackAsset;
					},
					target: 'http://localhost:3000',
					changeOrigin: true,
				},
			],
		},
	});
};
