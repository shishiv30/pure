/**
 * Index page section data as array in render order: hero, scrollview, points, gallery, timeline.
 * Image paths are relative to assets/images; links are path-only (e.g. /demo/ny/new-york).
 * Push to CMS: node cms/scripts/push-page-index.js
 */
export default [
	// 0: hero
	{
		image: {
			src: 'welcome/point0.jpeg',
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
	},
	// 1: scrollview
	{
		links: [
			{ href: '/demo/ny/new-york', text: 'New York, NY homes for sale' },
			{ href: '/demo/tx/san-antonio', text: 'San Antonio, TX homes for sale' },
			{ href: '/demo/tx/houston', text: 'Houston, TX homes for sale' },
			{ href: '/demo/nv/las-vegas', text: 'Las Vegas, NV homes for sale' },
			{ href: '/demo/fl/miami', text: 'Miami, FL homes for sale' },
			{ href: '/demo/il/chicago', text: 'Chicago, IL homes for sale' },
			{ href: '/demo/fl/orlando', text: 'Orlando, FL homes for sale' },
			{ href: '/demo/tx/austin', text: 'Austin, TX homes for sale' },
			{ href: '/demo/tx/dallas', text: 'Dallas, TX homes for sale' },
			{ href: '/demo/fl/ocala', text: 'Ocala, FL homes for sale' },
			{ href: '/demo/fl/naples', text: 'Naples, FL homes for sale' },
			{ href: '/demo/ga/atlanta', text: 'Atlanta, GA homes for sale' },
			{ href: '/demo/nc/charlotte', text: 'Charlotte, NC homes for sale' },
			{ href: '/demo/ca/los-angeles', text: 'Los Angeles, CA homes for sale' },
			{ href: '/demo/pa/philadelphia', text: 'Philadelphia, PA homes for sale' },
			{ href: '/demo/fl/cape-coral', text: 'Cape Coral, FL homes for sale' },
			{ href: '/demo/fl/sarasota', text: 'Sarasota, FL homes for sale' },
			{ href: '/demo/az/tucson', text: 'Tucson, AZ homes for sale' },
			{ href: '/demo/sc/myrtle-beach', text: 'Myrtle Beach, SC homes for sale' },
			{ href: '/demo/ca/bakersfield', text: 'Bakersfield, CA homes for sale' },
			{ href: '/demo/fl/tampa', text: 'Tampa, FL homes for sale' },
			{ href: '/demo/fl/jacksonville', text: 'Jacksonville, FL homes for sale' },
			{ href: '/demo/az/phoenix', text: 'Phoenix, AZ homes for sale' },
			{ href: '/demo/tn/nashville', text: 'Nashville, TN homes for sale' },
			{ href: '/demo/fl/boca-raton', text: 'Boca Raton, FL homes for sale' },
			{ href: '/demo/tx/el-paso', text: 'El Paso, TX homes for sale' },
			{ href: '/demo/fl/pensacola', text: 'Pensacola, FL homes for sale' },
			{ href: '/demo/fl/kissimmee', text: 'Kissimmee, FL homes for sale' },
			{ href: '/demo/mi/detroit', text: 'Detroit, MI homes for sale' },
			{ href: '/demo/ny/brooklyn', text: 'Brooklyn, NY homes for sale' },
		],
	},
	// 2: points
	{
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
				ctaHref: '/document/',
				image: { src: 'welcome/point1.jpeg', alt: 'CSS-driven states', loading: 'lazy' },
			},
			{
				title: 'Plain JavaScript',
				body:
					'Interaction and state switching use vanilla JS. No framework-specific APIs to learn; plug in your own ' +
					'logic, accessibility, and progressive enhancement where you need it.',
				ctaText: 'See examples',
				ctaHref: '/document/',
				image: { src: 'welcome/point2.jpeg', alt: 'JavaScript for interaction', loading: 'lazy' },
			},
			{
				title: 'Lightweight by design',
				body:
					'Focused on client-side rendering and UX only. Small footprint, clear conventions, and patterns that scale ' +
					'from static pages to dynamic apps without bloat.',
				ctaText: 'Try the demo',
				ctaHref: '/demo/',
				image: { src: 'welcome/point3.jpeg', alt: 'Lightweight framework', loading: 'lazy' },
			},
		],
	},
	// 3: gallery
	{
		title: 'Gallery',
		imagesMeta: [
			{ path: 'bg/01.jpeg', title: 'Image 01', description: 'First image in the gallery', index: 1 },
			{ path: 'bg/02.jpeg', title: 'Image 02', description: 'Second image in the gallery', index: 2 },
			{ path: 'bg/03.jpeg', title: 'Image 03', description: 'Third image in the gallery', index: 3 },
			{ path: 'bg/04.jpeg', title: 'Image 04', description: 'Fourth image in the gallery', index: 4 },
			{ path: 'bg/05.jpeg', title: 'Image 05', description: 'Fifth image in the gallery', index: 5 },
			{ path: 'bg/06.jpeg', title: 'Image 06', description: 'Sixth image in the gallery', index: 6 },
			{ path: 'bg/07.jpeg', title: 'Image 07', description: 'Seventh image in the gallery', index: 7 },
			{ path: 'bg/08.jpeg', title: 'Image 08', description: 'Eighth image in the gallery', index: 8 },
		],
		initialIndex: 0,
		alt: 'Pure UI background gallery',
	},
	// 4: timeline
	{
		heading: 'Project timeline',
		intro: 'Key milestones in the introduction and evolution of the Pure UI project.',
		entries: [
			{ type: 'title', label: 'Feb 2026' },
			{ type: 'desc', date: 'Feb 10, 2026', text: 'Infra build with AWS' },
			{ type: 'desc', date: 'Feb 2, 2026', text: 'Add AI code review' },
			{ type: 'title', label: 'Jan 2026' },
			{ type: 'desc', date: 'Jan 24, 2026', text: 'Add workflow for build GH page' },
			{ type: 'title', label: 'Dec 2025' },
			{ type: 'desc', date: 'Dec 11, 2025', text: 'Remove jQuery' },
			{ type: 'title', label: 'Oct 2025' },
			{ type: 'desc', date: 'Oct 12, 2025', text: 'Introduce web component' },
			{ type: 'title', label: 'Sep 2025' },
			{ type: 'desc', date: 'Sep 7, 2025', text: 'Build page system' },
			{ type: 'title', label: 'Aug 2025' },
			{ type: 'desc', date: 'Aug 3, 2025', text: 'Refactor core and plugin' },
			{ type: 'title', label: 'Jun 2025' },
			{ type: 'desc', date: 'Jun 9, 2025', text: 'Ability to call SOA' },
		],
	},
];
