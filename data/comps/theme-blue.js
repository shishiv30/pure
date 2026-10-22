/**
 * Blue theme (hue 210). Comp key "theme-blue", type "theme"; reference from page meta.theme to apply.
 */
export default {
	default: {
		'--color-root-major-hue': '210',
		'--color-root-major-saturation': '85%',
		'--color-root-major-lightness': '25%',
		'--color-root-major-lightness-l1': '96%',
		'--logo': 'url("/assets/images/logo.svg")',
		'--logo-bg': 'url("/assets/images/logo-bg.svg")',
		'--logo-size': '60px',
	},
	dark: {
		'--color-root-major-lightness': '15%',
		'--color-root-major-lightness-l1': '75%',
		'--logo': 'url("/assets/images/logo-bg.svg")',
		'--logo-bg': 'url("/assets/images/logo-bg.svg")',
	},
};
