import { template } from '../comps/comp_template.js';
/**
 * Human evolution page: introduce, types, behavior, body, geo, dna, evolution history.
 * Path: page/human. Theme: theme-yellow. Seed: node cms/scripts/seed-and-sync.js
 */
export const name = 'human';
export const path = 'page/human';
export const meta = {
	title: 'Human Evolution | Pure',
	desc: 'Explore human introduction, types, behavior, body, geography, DNA, and evolution history.',
	keywords: 'human evolution, human types, human behavior, human body, human geography, human DNA, evolution history',
	theme: 'theme-pink',
};

export default [
	// 0: hero — human introduce
	{
		template: template.hero,
		image: {
			path: '/welcome/point0.jpeg',
			alt: 'Human Evolution',
			loading: 'eager',
		},
		title: 'Human Evolution',
		subtitle: 'From origins to today: an overview of the human story.',
		subtitleIcon: 'icon-bolt',
		desc:
			'This page introduces humans: who we are, the diversity of human types, behavior, anatomy, ' +
			'geographic distribution, genetics, and the long arc of evolution that shaped our species.',
	},
	// 1: scrollview
	null,
	// 2: points — human types, behavior, body, geo info, dna
	{
		template: template.points,
		heading: 'Dimensions of Humanity',
		intro: 'Key facets that define and describe our species:',
		items: [
			{
				title: 'Human types',
				body: 'Diversity of human populations and classifications across history and geography.',
				image: { path: '/welcome/point1.jpeg', alt: 'Human types', loading: 'lazy' },
			},
			{
				title: 'Human behavior',
				body: 'Patterns of behavior, culture, society, and cognition that characterize humans.',
				image: { path: '/welcome/point2.jpeg', alt: 'Human behavior', loading: 'lazy' },
			},
			{
				title: 'Human body',
				body: 'Anatomy, physiology, and the biological systems that make up the human body.',
				image: { path: '/welcome/point3.jpeg', alt: 'Human body', loading: 'lazy' },
			},
			{
				title: 'Human geo info',
				body: 'Where humans live: distribution, migration, and adaptation to environments.',
				image: { path: '/welcome/point4.jpeg', alt: 'Human geography', loading: 'lazy' },
			},
			{
				title: 'Human DNA',
				body: 'Genetics, heredity, and how DNA tells the story of human ancestry and variation.',
				image: { path: '/welcome/point5.jpeg', alt: 'Human DNA', loading: 'lazy' },
			},
		],
	},
	// 3: gallery
	null,
	// 4: timeline — human evolution history
	{
		template: template.timeline,
		heading: 'Human evolution history',
		intro: 'Major milestones in the evolution of the human lineage.',
		entries: [
			{ type: 'title', label: 'Early hominins' },
			{ type: 'desc', date: '~7–6 Ma', text: 'Divergence from other great apes; early hominin fossils in Africa.' },
			{ type: 'title', label: 'Australopithecus' },
			{ type: 'desc', date: '~4–2 Ma', text: 'Bipedalism, tool use; Lucy and related species.' },
			{ type: 'title', label: 'Genus Homo' },
			{ type: 'desc', date: '~2.8 Ma', text: 'Emergence of Homo; larger brains, stone tools.' },
			{ type: 'title', label: 'Homo sapiens' },
			{ type: 'desc', date: '~300 ka', text: 'Origin of modern humans in Africa; spread and replacement.' },
			{ type: 'title', label: 'Today' },
			{ type: 'desc', date: 'Today', text: 'Global population; culture, technology, and ongoing adaptation.' },
		],
	},
];
