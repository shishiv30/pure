import config from '../config.js';
import footerTable from '../../data/page/footer.js';

const APP_URL = (config.appUrl || '').replace(/\/$/, '');
const APP_NAME = process.env.APP_NAME || 'Pure';

const COMPONENT_NAME = 'footer';
const COMPONENT_TEMPLATE = 'html_footer';

function toHref(path) {
	if (!path || path.startsWith('http') || path.startsWith('#')) return path || '#';
	return `${APP_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

function buildFooterFromTable(rows) {
	const sorted = [...rows].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

	let contact = { title: '', email: '', phone: '', address: '' };
	let social = { title: '', links: [] };
	const menuItems = [];

	for (const row of sorted) {
		if (row.type === 'title') {
			const children = sorted.filter((r) => r.parentId === row.id);
			const hasKw = children.some((r) => r.type === 'kw');
			const hasSocialLinks = children.some((c) => c.type === 'link' && c.icon);
			const hasMenuLinks = children.some((c) => c.type === 'link' && !c.icon);
			if (hasKw && children.some((r) => r.key === 'email')) {
				contact.title = row.text || '';
				for (const c of children) {
					if (c.type === 'kw' && c.key) contact[c.key] = c.text || '';
				}
			} else if (hasSocialLinks) {
				social.title = row.text || '';
				social.links = children
					.filter((c) => c.type === 'link')
					.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
					.map((c) => ({
						icon: c.icon,
						ariaLabel: c.key || c.text,
						href: toHref(c.path)
					}));
			} else if (hasMenuLinks && (row.text == null || row.text === '')) {
				menuItems.push(
					...children
						.filter((c) => c.type === 'link')
						.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
						.map((c) => ({ order: c.order, text: c.text || c.key, href: toHref(c.path) }))
				);
			}
		}
	}

	const menu = menuItems.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((m) => ({ text: m.text, href: m.href }));

	return {
		contact,
		social,
		menu,
		appName: APP_NAME,
		year: new Date().getFullYear()
	};
}

/**
 * Create the footer UI component config.
 * @param {Array|null} [footerTableOverride] - Optional footer rows (e.g. from CMS comp key footer). If null/undefined, uses data/page/footer.js.
 * @returns {{ name: string, template: string, data: object }}
 */
export function createFooterComponent(footerTableOverride) {
	const rows = footerTableOverride != null ? footerTableOverride : footerTable;
	return {
		name: COMPONENT_NAME,
		template: COMPONENT_TEMPLATE,
		data: Array.isArray(rows) ? buildFooterFromTable(rows) : buildFooterFromTable(footerTable),
	};
}

