/**
 * AI Trend page section data as array in render order: hero, scrollview, points, gallery, timeline.
 * Image paths are relative to assets/images; links are path-only (e.g. /demo/ny/new-york).
 * Push to CMS: node cms/scripts/push-page.js ai-trend
 */
export default [
	// 0: hero
	{
		image: {
			src: 'welcome/point0.jpeg',
			alt: 'AI Trend Hero',
			loading: 'eager',
		},
		title: 'AI Trend: Shaping the Future',
		subtitle: 'Where intelligence meets innovation and every breakthrough rewrites what\'s possible.',
		subtitleIcon: 'icon-bolt',
		desc:
			'AI Trend tracks the pulse of artificial intelligence—from large language models and computer vision ' +
			'to autonomous systems and ethical AI. Stay ahead with insights on the technologies transforming ' +
			'industries and daily life.',
	},
	// 1: scrollview (optional - can be null or empty object)
	null,
	// 2: points
	{
		heading: 'Why AI Trend Matters',
		intro:
			'From research labs to production systems, AI is the defining technology of the decade. These pillars ' +
			'define the landscape:',
		items: [
			{
				title: 'Generative AI',
				body:
					'LLMs, image and video generation, and multimodal models are reshaping content creation, search, ' +
					'and human–machine interaction at unprecedented scale.',
				image: { src: 'welcome/point1.jpeg', alt: 'Generative AI', loading: 'lazy' },
			},
			{
				title: 'Automation & Efficiency',
				body:
					'AI-driven automation is optimizing supply chains, customer service, and decision-making across ' +
					'every sector, from healthcare to finance.',
				image: { src: 'welcome/point2.jpeg', alt: 'Automation & Efficiency', loading: 'lazy' },
			},
			{
				title: 'Ethics & Governance',
				body:
					'Bias, transparency, privacy, and safety are driving new frameworks and regulations as AI becomes ' +
					'embedded in critical systems.',
				image: { src: 'welcome/point3.jpeg', alt: 'Ethics & Governance', loading: 'lazy' },
			},
			{
				title: 'Edge & Real-Time',
				body:
					'On-device and edge AI enable low-latency, privacy-preserving applications from smartphones to ' +
					'industrial IoT.',
				image: { src: 'welcome/point4.jpeg', alt: 'Edge & Real-Time', loading: 'lazy' },
			},
			{
				title: 'Research & Open Source',
				body:
					'Open models, datasets, and tools are accelerating adoption and leveling the playing field for ' +
					'developers and organizations worldwide.',
				image: { src: 'welcome/point5.jpeg', alt: 'Research & Open Source', loading: 'lazy' },
			},
			{
				title: 'Careers & Skills',
				body:
					'AI literacy and ML engineering skills are in high demand; understanding trends helps you stay ' +
					'relevant and build the future.',
				image: { src: 'welcome/point6.jpeg', alt: 'Careers & Skills', loading: 'lazy' },
			},
		],
	},
	// 3: gallery (optional - can be null)
	null,
	// 4: timeline
	{
		heading: 'Milestones in AI',
		intro: 'Key moments that shaped the evolution of artificial intelligence.',
		entries: [
			{ type: 'title', label: '1950s' },
			{ type: 'desc', date: '1950s', text: 'Birth of AI — Turing\'s test and early programs; the term "artificial intelligence" is coined at the Dartmouth workshop, setting the stage for decades of research.' },
			{ type: 'title', label: '1990s–2000s' },
			{ type: 'desc', date: '1990s–2000s', text: 'Machine Learning Rise — Statistical ML, support vector machines, and neural networks gain traction; data-driven approaches begin to outperform hand-coded rules in many domains.' },
			{ type: 'title', label: '2012–2020' },
			{ type: 'desc', date: '2012–2020', text: 'Deep Learning Era — ImageNet and deep learning revolutionize vision and NLP; transformers emerge and scale, enabling models like BERT and GPT-2.' },
			{ type: 'title', label: '2020–2024' },
			{ type: 'desc', date: '2020–2024', text: 'Generative Breakthrough — GPT-3, DALL·E, Stable Diffusion, and ChatGPT bring generative AI to the mainstream; multimodal and agentic systems take center stage.' },
			{ type: 'title', label: 'Today' },
			{ type: 'desc', date: 'Today', text: 'AI Everywhere — AI is embedded in products, workflows, and policy; the focus shifts to safety, alignment, regulation, and sustainable deployment across industries.' },
		],
	},
];
