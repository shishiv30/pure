//change to import fro above code
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
// Note: Install copy-webpack-plugin: npm install --save-dev copy-webpack-plugin
// For webpack 5, use: import CopyPlugin from 'copy-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import { env } from 'process';
import path from 'path';
import { fileURLToPath } from 'url';
import pageSettings from './webpack.config.base.page.js';
import fs from 'fs';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const entry = {};
const plugins = [
	new MiniCssExtractPlugin({
		filename: '[name].min.css',
		chunkFilename: '[id].css',
	}),
];
pageSettings.pages.forEach((page) => {
	entry[page.name] = {
		import: page.entry,
	};
	plugins.push(new HtmlWebpackPlugin(page));
});
export default () => {
	// console.log(env);
	return {
		entry: entry,
		module: {
			rules: [
				{
					test: /\.(woff2?|ttf|eot)$/i,
					type: 'asset/resource',
					generator: {
						filename: 'font.[name][ext]',
					},
				},
				{
					// Output: images/[path relative to assets/images][name][ext] (e.g. images/welcome/point0.jpeg)
					// Preserves folder structure. CDN URL mapping: helpers/imgCdn.js
					test: /\.(svg|png|jpe?g|gif|ico|webp)$/i,
					type: 'asset/resource',
					generator: {
						filename: (pathData) => {
							const filePath = pathData.filename;
							const assetsImagesPath = path.resolve(__dirname, 'client/assets/images');
							if (filePath.startsWith(assetsImagesPath)) {
								const relativePath = path.relative(assetsImagesPath, filePath);
								const dir = path.dirname(relativePath);
								const name = path.basename(relativePath, path.extname(relativePath));
								const ext = path.extname(relativePath);
								if (dir === '.') {
									return `images/${name}${ext}`;
								}
								return `images/${dir}/${name}${ext}`;
							}
							// For other images (e.g. imported from node_modules), use simple name
							const name = path.basename(filePath, path.extname(filePath));
							const ext = path.extname(filePath);
							return `images/${name}${ext}`;
						},
					},
				},
				{
					test: /\.scss$/i,
					use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
				},
				{
					test: /\.js$/i,
					include: path.resolve(__dirname, 'client'),
					loader: 'babel-loader',
				},
				{
					test: /\.html$/i,
					loader: 'html-loader',
					options: {
						sources: {
							list: [
								'...',
								{
									tag: 'img',
									attribute: 'data-src',
									type: 'src',
								},
								{
									tag: 'a-videosphere',
									attribute: 'src',
									type: 'src',
								},
							],
						},
						preprocessor: (content, loaderContext) => {
							// Simple include processor for <!-- include:header.html -->
							return content.replace(/<!--\s*include:([^>]+?)\s*-->/g, (match, includePath) => {
								const fullPath = path.resolve(__dirname, 'client/components', includePath.trim());
								try {
									return fs.readFileSync(fullPath, 'utf8');
								} catch (error) {
									console.warn(`Could not include ${includePath}: ${error.message}`);
									return match;
								}
							});
						},
					},
				},
			],
		},
		plugins: [
			...plugins,
			// Copy all images from client/assets/images to dist/images/ preserving folder structure
			new CopyPlugin({
				patterns: [
					{
						from: path.resolve(__dirname, 'client/assets/images'),
						to: path.resolve(__dirname, 'dist/images'),
						noErrorOnMissing: true,
					},
				],
			}),
		],
	};
};
