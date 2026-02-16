import config from '../config.js';
import headerTable from '../../data/page/header.js';

const linkTable = headerTable;
const APP_URL = config.appUrl || '';

const COMPONENT_NAME = 'header';
const COMPONENT_TEMPLATE = 'comp_header';

function toHref(path) {
	return path.startsWith('javascript') || path === '#' || path === ''
		? (path || 'javascript:;')
		: `${APP_URL.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
}

function buildMenuFromLinks(links) {
	const sorted = [...links].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
	const topLevel = sorted.filter((row) => row.parentId == null || row.parentId === '');

	function toItem(row) {
		const href = toHref(row.path);
		const children = sorted
			.filter((r) => r.parentId === row.id)
			.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
			.map((r) => ({ text: r.text, href: toHref(r.path) }));
		return children.length
			? { text: row.text, href, children }
			: { text: row.text, href };
	}

	return topLevel.map(toItem);
}

function getHeaderData(linkTableOverride) {
	const links = linkTableOverride != null ? linkTableOverride : linkTable;
	return {
		name: 'Header',
		search: {
			inputId: 'headerInput',
			placeholder: 'Search for ...',
			method: 'GET',
			url: `${APP_URL}/api/geo`,
			keys: 'type',
			type: 'city',
		},
		menu: Array.isArray(links) ? buildMenuFromLinks(links) : buildMenuFromLinks(linkTable),
	};
}

/**
 * Create the header UI component config.
 * @param {Array|null} [linkTableOverride] - Optional link rows (e.g. from CMS comp key header). If null/undefined, uses data/links.js.
 * @returns {{ name: string, template: string, data: object }}
 */
export function createHeaderComponent(linkTableOverride) {
	return {
		name: COMPONENT_NAME,
		template: COMPONENT_TEMPLATE,
		data: getHeaderData(linkTableOverride),
	};
}

