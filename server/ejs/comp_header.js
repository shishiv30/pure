import config from '../config.js';

const APP_URL = config.appUrl || '';

const COMPONENT_NAME = 'header';
const COMPONENT_TEMPLATE = 'comp_header';

const headerData = {
	name: 'Header',
	search: {
		inputId: 'headerInput',
		placeholder: 'Search for ...',
		method: 'GET',
		url: `${APP_URL}/api/geo`,
		keys: 'type',
		type: 'city',
	},
	menu: [
		{
			text: 'Home',
			href: `${APP_URL}/index`,
		},
		{
			text: 'Demo',
			href: `${APP_URL}/demo`,
			children: [
				{
					text: 'About',
					href: `${APP_URL}/about.html`,
				},
				{
					text: 'War System',
					href: `${APP_URL}/dnd.html`,
				},
				{
					text: 'Survey',
					href: `${APP_URL}/survey.html`,
				},
			],
		},
		{
			text: 'About',
			href: `${APP_URL}/about`,
		},
		{
			text: 'Contact',
			href: `${APP_URL}/contact`,
		},
	],
};

/**
 * Create the header UI component config.
 * @returns {{ name: string, template: string, data: object }}
 */
export function createHeaderComponent() {
	return {
		name: COMPONENT_NAME,
		template: COMPONENT_TEMPLATE,
		data: headerData,
	};
}

