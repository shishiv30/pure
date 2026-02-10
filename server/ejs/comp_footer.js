import config from '../config.js';

const APP_URL = config.appUrl || '';
const APP_NAME = process.env.APP_NAME || 'Pure';

const COMPONENT_NAME = 'footer';
const COMPONENT_TEMPLATE = 'html_footer';

const footerData = {
	contact: {
		title: 'Contact Us',
		email: 'info@company.com',
		phone: '(555) 123-4567',
		address: '123 Main St, City, State 12345',
	},
	social: {
		title: 'Follow Us',
		links: [
			{ icon: 'facebook', ariaLabel: 'Facebook', href: '#' },
			{ icon: 'twitter', ariaLabel: 'Twitter', href: '#' },
			{ icon: 'linkedin', ariaLabel: 'LinkedIn', href: '#' },
			{ icon: 'instagram', ariaLabel: 'Instagram', href: '#' },
		],
	},
	menu: [
		{ text: 'Home', href: `${APP_URL}/` },
		{ text: 'Demo', href: `${APP_URL}/demo.html` },
		{ text: 'About', href: `${APP_URL}/about.html` },
		{ text: 'Contact', href: `${APP_URL}/contact.html` },
	],
	appName: APP_NAME,
	year: new Date().getFullYear(),
};

/**
 * Create the footer UI component config.
 * @returns {{ name: string, template: string, data: object }}
 */
export function createFooterComponent() {
	return {
		name: COMPONENT_NAME,
		template: COMPONENT_TEMPLATE,
		data: footerData,
	};
}

