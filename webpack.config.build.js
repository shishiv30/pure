import baseConfig from './webpack.config.base.js';
import { merge } from 'webpack-merge';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import WebpackPwaManifest from 'webpack-pwa-manifest';
import WorkboxPlugin from 'workbox-webpack-plugin';

export default (env) => {
	console.log('deploy:', env.deploy);
	const publicPath = env.deploy ? 'https://shishiv30.github.io/pure/' : 'http://localhost:8080/';
	var config = baseConfig(env);
	return merge(config, {
		mode: 'production',
		output: {
			path: path.resolve(__dirname, 'dist'),
			filename: '[name].min.js',
			publicPath: publicPath,
			clean: true,
		},
		// recordsPath: path.join(__dirname, 'records.json'),
		plugins: [
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
						src: path.resolve('./src/assets/img/logo.png'),
						sizes: [48, 96, 192, 256, 384, 512],
						purpose: 'any maskable',
					},
				],
			}),
			new WorkboxPlugin.InjectManifest({
				swSrc: './sw.js',
			}),
		]
	});
};
