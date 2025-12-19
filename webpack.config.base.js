//change to import fro above code
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
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
					test: /\.(svg|png|jpe?g|gif|ico|webp)$/i,
					type: 'asset/resource',
					generator: {
						filename: 'img.[name][ext]',
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
		plugins: plugins,
	};
};
