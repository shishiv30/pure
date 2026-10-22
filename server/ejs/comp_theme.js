import themeData from '../../data/comps/theme.js';

/**
 * Generate inline CSS from theme data.
 * @param {object|null} [themeOverride] - Optional theme object. If null/undefined, uses data/comps/theme.js.
 * @param {string} [cdnHost] - Optional CDN host to prepend to image paths.
 * @returns {string} CSS string
 */
export function getThemeInlineCss(themeOverride, cdnHost = '') {
	const theme = themeOverride || themeData;
	if (!theme || typeof theme !== 'object') {
		return '';
	}

	const processValue = (value) => {
		if (typeof value === 'string' && value.includes('/assets/images/')) {
			const cdnBase = cdnHost || '';
			return value.replace('/assets/images/', cdnBase ? `${cdnBase}/images/` : '/images/');
		}
		return value;
	};

	const dumpProps = (obj) => {
		let css = '';
		for (const key in obj) {
			if (obj.hasOwnProperty(key)) {
				css += `  ${key}: ${processValue(obj[key])};\n`;
			}
		}
		return css;
	};

	let css = '';
	if (theme.default && typeof theme.default === 'object') {
		css += ':root {\n';
		css += dumpProps(theme.default);
		css += '}\n';
	}
	if (theme.dark && typeof theme.dark === 'object') {
		const darkProps = dumpProps(theme.dark);
		css += ':root.theme-dark {\n';
		css += darkProps;
		css += '}\n';
		css += '@media (prefers-color-scheme: dark) {\n';
		css += ':root:not(.theme-light) {\n';
		css += darkProps;
		css += '}\n';
		css += '}\n';
	}
	return css;
}
