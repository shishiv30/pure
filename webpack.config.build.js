import webpack from 'webpack';
import baseConfig from './webpack.config.base.js';
import { merge } from 'webpack-merge';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './server/config.js';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import {
	appBaseFromPublicPath,
	pathnameFromHostUrl,
	prefixRootRelativeUrls,
} from './helpers/htmlPath.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import WebpackPwaManifest from 'webpack-pwa-manifest';
import WorkboxPlugin from 'workbox-webpack-plugin';
import CleanupHotUpdatePlugin from './helpers/webpack-cleanup-plugin.js';

export default (env) => {
	console.log('environment variables:', env);
	// Use relative path when no explicit CDN host so assets are same-origin (avoids CORS on Docker/local)
	const publicPath = config.cdnHost && config.cdnHost !== config.appHost
		? `${String(config.cdnHost)}/`
		: '/';
	const appBase = appBaseFromPublicPath(publicPath);
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
			new webpack.DefinePlugin({
				__APP_BASE__: JSON.stringify(appBase),
			}),
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
			// Root-relative href/src (e.g. /layout.html) stay valid under a subpath
			// such as https://*.github.io/pure/ — ./ links break when the address changes.
			{
				apply(compiler) {
					const base = pathnameFromHostUrl(String(publicPath).replace(/\/$/, ''));
					if (!base) return;
					compiler.hooks.compilation.tap('PrefixRootRelativeHtml', (compilation) => {
						HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tap(
							'PrefixRootRelativeHtml',
							(data) => {
								data.html = prefixRootRelativeUrls(data.html, base);
								return data;
							},
						);
					});
				},
			},
		],
	});
};
