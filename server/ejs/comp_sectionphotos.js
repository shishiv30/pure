import config from '../config.js';

const APP_URL = config.appUrl || '';

const COMPONENT_NAME = 'sectionPhotos';
const COMPONENT_TEMPLATE = 'comp_sectionphotos';

const sectionPhotosData = {
	heading: 'Why Pure UI',
	intro:
		'A lightweight client-side framework built around one idea: define interface states with CSS and drive ' +
		'interaction with plain JavaScript. No heavy runtime, no lock-in — just better UX.',
	items: [
		{
			title: 'States in CSS',
			body:
				'All visible states — hover, focus, active, open, loading — live in stylesheets. Markup stays minimal; you ' +
				'toggle classes or attributes and let CSS handle the rest.',
			ctaText: 'Read the docs',
			ctaHref: `${APP_URL}/document/`,
			image: {
				src: `${APP_URL}/assets/images/welcome/point1.jpeg`,
				alt: 'CSS-driven states',
				loading: 'lazy',
			},
		},
		{
			title: 'Plain JavaScript',
			body:
				'Interaction and state switching use vanilla JS. No framework-specific APIs to learn; plug in your own ' +
				'logic, accessibility, and progressive enhancement where you need it.',
			ctaText: 'See examples',
			ctaHref: `${APP_URL}/document/`,
			image: {
				src: `${APP_URL}/assets/images/welcome/point2.jpeg`,
				alt: 'JavaScript for interaction',
				loading: 'lazy',
			},
		},
		{
			title: 'Lightweight by design',
			body:
				'Focused on client-side rendering and UX only. Small footprint, clear conventions, and patterns that scale ' +
				'from static pages to dynamic apps without bloat.',
			ctaText: 'Try the demo',
			ctaHref: `${APP_URL}/demo/`,
			image: {
				src: `${APP_URL}/assets/images/welcome/point3.jpeg`,
				alt: 'Lightweight framework',
				loading: 'lazy',
			},
		},
	],
};

/**
 * Create the section photos UI component config.
 * @returns {{ name: string, template: string, data: object }}
 */
export function createSectionPhotosComponent() {
	return {
		name: COMPONENT_NAME,
		template: COMPONENT_TEMPLATE,
		data: sectionPhotosData,
	};
}
