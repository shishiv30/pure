import baseConfig from './webpack.config.base.js';
import { merge } from 'webpack-merge';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './server/config.js';
import CleanupHotUpdatePlugin from './helpers/webpack-cleanup-plugin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (env) => {
	var baseWebpackConfig = baseConfig(env);
	return merge(baseWebpackConfig, {
		mode: config.webpackMode,
		devtool: config.webpackDevtool,
		stats: config.webpackStats,
		output: {
			path: path.resolve(__dirname, 'dist'),
			filename: '[name].min.js',
			publicPath: '/',
			clean: true,
		},
		plugins: [
			new CleanupHotUpdatePlugin({
				outputPath: path.resolve(__dirname, 'dist'),
			}),
		],
		devServer: {
			static: {
				directory: path.join(__dirname, 'dist'),
			},
			compress: true,
			port: config.webpackDevServerPort,
			host: config.webpackDevServerHost,
			hot: config.webpackHotReload,
			watchFiles: ['client/**/*'],
			// Write files to disk so they're available to the Node server
			devMiddleware: {
				writeToDisk: true,
			},
			client: {
				logging: 'error',
			},
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
					logLevel: 'error',
					target: config.appUrl,
					changeOrigin: true,
				},
			],
		},
	});
};
