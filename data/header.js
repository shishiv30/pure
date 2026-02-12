/**
 * Header nav link table: id, text, path (without domain), order, parentId.
 * parentId empty/null = top-level; otherwise id of parent (e.g. Demo's children have parentId: 2).
 */
export default [
	{ id: 1, text: 'Home', path: '/index', order: 1, parentId: null },
	{ id: 2, text: 'Demo', path: '/demo', order: 2, parentId: null },
	{ id: 3, text: 'About', path: '/about.html', order: 3, parentId: 2 },
	{ id: 4, text: 'ppt', path: 'presentation-slider.html', order: 4, parentId: 2 },
	{ id: 5, text: 'Survey', path: '/survey.html', order: 5, parentId: 2 },
	{ id: 6, text: 'AI Trend', path: '/page/ai-trend', order: 6, parentId: 2 },
	{ id: 10, text: 'Lower', path: '/lower.html', order: 7, parentId: 2 },
	{ id: 9, text: 'Sitemap', path: '/demo/sitemap', order: 7, parentId: 2 },
	{ id: 7, text: 'Document', path: '/document', order: 7, parentId: null },
	{ id: 8, text: 'Contact', path: 'javascript:;', order: 8, parentId: null },
];
