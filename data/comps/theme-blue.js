/**
 * Blue theme (hue 210). Comp key "theme-blue", type "theme"; reference from page meta.theme to apply.
 */
export default {
	default: {
		'--color-major-default-hue': '210',
		'--color-major-default-saturation': '85%',
		'--color-major-default-lightness': '25%',
		'--color-major-default-lightness-l1': '96%',
		'--logo': 'url("/assets/images/logo.svg")',
		'--logo-bg': 'url("/assets/images/logo-bg.svg")',
		'--logo-size': '60px',
	},
	dark: {
		'--color-major-default-lightness': '15%',
		'--color-major-default-lightness-l1': '75%',
		'--logo': 'url("/assets/images/logo-bg.svg")',
		'--logo-bg': 'url("/assets/images/logo-bg.svg")',
	},
};
