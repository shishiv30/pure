import baseConfig from './webpack.config.base.js';
import { merge } from 'webpack-merge';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './server/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import WebpackPwaManifest from 'webpack-pwa-manifest';
import WorkboxPlugin from 'workbox-webpack-plugin';
import CleanupHotUpdatePlugin from './helpers/webpack-cleanup-plugin.js';

export default (env) => {
	console.log('environment variables:', env);
	// Use relative path when no explicit CDN so assets are same-origin (avoids CORS on Docker/local)
	const publicPath =
		config.cdnUrl && config.cdnUrl !== config.appUrl
			? `${String(config.cdnUrl).replace(/\/$/, '')}/`
			: '/';
	return merge(baseConfig(env), {
		mode: config.webpackMode,
		devtool: config.webpackDevtool,
		stats: config.webpackStats,
		output: {
			path: path.resolve(__dirname, 'dist'),
			filename: '[name].min.js',
			publicPath: publicPath,
			clean: true,
		},
		optimization: {
			minimize: config.webpackMinimize,
		},
		// recordsPath: path.join(__dirname, 'records.json'),
		plugins: [
			new CleanupHotUpdatePlugin({
				outputPath: path.resolve(__dirname, 'dist'),
			}),
			// new BundleAnalyzerPlugin(),
			new WebpackPwaManifest({
				name: 'CUI pure framework',
				short_name: 'CUI pure framework',
				description: 'UI solution base on pure js and css.',
				display: 'standalone',
				theme_color: '#ffffff',
				background_color: '#ffffff',
				start_url: publicPath + 'index.html',
				icons: [
					{
						src: path.resolve('./client/assets/img/logo.png'),
						sizes: [48, 96, 192, 256, 384, 512],
						purpose: 'any maskable',
					},
				],
			}),
			new WorkboxPlugin.InjectManifest({
				swSrc: './sw.js',
			}),
		],
	});
};
