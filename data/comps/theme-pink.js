/**
 * Pink theme (hue 330), logo.svg / logo-bg.svg.
 * Seeded as comp key "theme-pink"; reference from page meta.theme to apply.
 */
export default {
	default: {
		'--color-root-major-hue': '330',
		'--color-root-major-saturation': '85%',
		'--color-root-major-lightness': '25%',
		'--color-root-major-lightness-l1': '96%',
		'--logo': 'url("/assets/images/logo.svg")',
		'--logo-bg': 'url("/assets/images/logo-bg.svg")',
		'--logo-size': '60px',
	},
	dark: {
		'--color-root-bg-lightness': '75%',
		'--color-root-bg-lightness-l1': '55%',
		'--color-root-lightness': '95%',
		'--color-root-lightness-l1': '100%',
		'--color-root-major-lightness': '75%',
		'--color-root-major-lightness-l1': '15%',
		'--logo': 'url("/assets/images/logo-bg.svg")',
		'--logo-bg': 'url("/assets/images/logo-bg.svg")',
	},
};
