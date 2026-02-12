/**
 * Footer data: id, icon, key, path, text, order, parentId, type.
 * type 'title': section header, only text.
 * type 'kw': key-value, key + text (e.g. email, phone, address).
 * type 'link': key = ariaLabel, path, text, optional icon (social = icon; menu = no icon).
 * parentId groups items under a title (e.g. contact details under id 1, social under id 5).
 * Menu links: type 'link', parentId = empty title node (no icon on links).
 */
export default [
	{ id: 1, type: 'title', text: 'Contact Us', order: 1, parentId: null },
	{ id: 2, type: 'kw', key: 'email', text: 'info@company.com', order: 2, parentId: 1 },
	{ id: 3, type: 'kw', key: 'phone', text: '(555) 123-4567', order: 3, parentId: 1 },
	{ id: 4, type: 'kw', key: 'address', text: '123 Main St, City, State 12345', order: 4, parentId: 1 },
	{ id: 5, type: 'title', text: 'Follow Us', order: 5, parentId: null },
	{ id: 6, type: 'link', key: 'Facebook', icon: 'facebook', path: '#', text: 'Facebook', order: 6, parentId: 5 },
	{ id: 7, type: 'link', key: 'Twitter', icon: 'twitter', path: '#', text: 'Twitter', order: 7, parentId: 5 },
	{ id: 8, type: 'link', key: 'LinkedIn', icon: 'linkedin', path: '#', text: 'LinkedIn', order: 8, parentId: 5 },
	{ id: 9, type: 'link', key: 'Instagram', icon: 'instagram', path: '#', text: 'Instagram', order: 9, parentId: 5 },
	{ id: 10, type: 'title', text: '', order: 10, parentId: null },
	{ id: 11, type: 'link', key: 'Home', path: '/', text: 'Home', order: 11, parentId: 10 },
	{ id: 12, type: 'link', key: 'Demo', path: '/demo.html', text: 'Demo', order: 12, parentId: 10 },
	{ id: 13, type: 'link', key: 'About', path: '/about.html', text: 'About', order: 13, parentId: 10 },
	{ id: 14, type: 'link', key: 'Contact', path: '/contact.html', text: 'Contact', order: 14, parentId: 10 },
];
