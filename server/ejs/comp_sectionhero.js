import config from '../config.js';

const APP_URL = config.appUrl || '';

const COMPONENT_NAME = 'sectionHero';
const COMPONENT_TEMPLATE = 'comp_sectionhero';

const sectionHeroData = {
	image: {
		src: `${APP_URL}/assets/images/welcome/point0.jpeg`,
		alt: 'Welcome Hero',
		loading: 'eager',
	},
	title: 'Pure UI',
	subtitle: 'client-side rendering framework.',
	subtitleIcon: 'icon-keyboard-o',
	desc:
		'Pure UI is a lightweight UI framework that focuses solely on client-side rendering for user ' +
		'experience. The framework itself is dedicated to enhancing user experience. The core idea is to define interface ' +
		'states purely with CSS and to use pure JavaScript for interaction and state switching.',
};

/**
 * Create the section hero UI component config.
 * @returns {{ name: string, template: string, data: object }}
 */
export function createSectionHeroComponent() {
	return {
		name: COMPONENT_NAME,
		template: COMPONENT_TEMPLATE,
		data: sectionHeroData,
	};
}
