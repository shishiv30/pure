module.exports = {
	env: {
		browser: true,
		es6: true,
		jquery: true,
		node: true,
	},
	globals: {
		window: true,
		Mustache: true,
		browser: true,
		console: true,
		workbox: true,
		importScripts: true,
	},
	extends: 'eslint:recommended',
	rules: {
		semi: ['error', 'always'],
		quotes: ['error', 'single'],
	},
	parserOptions: {
		sourceType: 'module',
	},
};
