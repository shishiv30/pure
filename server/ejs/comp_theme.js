import config from '../config.js';
import themeData from '../../data/theme.js';

/**
 * Generate inline CSS from theme data.
 * @param {object|null} [themeOverride] - Optional theme object. If null/undefined, uses data/theme.js.
 * @param {string} [cdnUrl] - Optional CDN URL to prepend to image paths.
 * @returns {string} CSS string
 */
export function getThemeInlineCss(themeOverride, cdnUrl = '') {
	const theme = themeOverride || themeData;
	if (!theme || typeof theme !== 'object') {
		return '';
	}
	
	// Helper function to process CSS values and replace image paths with cdnUrl
	const processValue = (value) => {
		if (typeof value === 'string' && value.includes('/assets/images/')) {
			// Replace /assets/images/ with cdnUrl + /images/
			const cdnBase = cdnUrl ? cdnUrl.replace(/\/$/, '') : '';
			return value.replace('/assets/images/', cdnBase ? `${cdnBase}/images/` : '/images/');
		}
		return value;
	};
	
	let css = '';
	if (theme.default && typeof theme.default === 'object') {
		css += 'body {\n';
		for (const key in theme.default) {
			if (theme.default.hasOwnProperty(key)) {
				const value = processValue(theme.default[key]);
				css += `  ${key}: ${value};\n`;
			}
		}
		css += '}\n';
	}
	if (theme.dark && typeof theme.dark === 'object') {
		css += 'body.theme-dark {\n';
		for (const key in theme.dark) {
			if (theme.dark.hasOwnProperty(key)) {
				const value = processValue(theme.dark[key]);
				css += `  ${key}: ${value};\n`;
			}
		}
		css += '}\n';
	}
	return css;
}
