import config from '../config.js';
import { getImgCdnUrl } from '../../helpers/imgCdn.js';

const APP_URL = config.appUrl || '';
const CDN_URL = (config.cdnUrl || '').replace(/\/$/, '');

const COMPONENT_NAME = 'points';
const COMPONENT_TEMPLATE = 'comp_points';

const pointsData = {
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
				src: getImgCdnUrl(CDN_URL, 'welcome/point1.jpeg'),
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
				src: getImgCdnUrl(CDN_URL, 'welcome/point2.jpeg'),
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
				src: getImgCdnUrl(CDN_URL, 'welcome/point3.jpeg'),
				alt: 'Lightweight framework',
				loading: 'lazy',
			},
		},
	],
};

/**
 * Create the points UI component config.
 * @returns {{ name: string, template: string, data: object }}
 */
export function createPointsComponent() {
	return {
		name: COMPONENT_NAME,
		template: COMPONENT_TEMPLATE,
		data: pointsData,
	};
}
