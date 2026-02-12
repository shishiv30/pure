import config from '../config.js';

const COMPONENT_NAME = 'links';
const COMPONENT_TEMPLATE = 'comp_links';
const APP_URL = (config.appUrl || '').replace(/\/$/, '');

/**
 * Create the links UI component (responsive grid of links).
 * @param {{ href: string, text: string }[]} links - Array of link items
 * @returns {{ name: string, template: string, data: object[] }}
 */
export function createLinksComponent(links) {
	const linksArray = Array.isArray(links) ? links : [];
	const processedLinks = linksArray.map((link) => {
		if (!link || !link.href) {
			return link;
		}
		const href = link.href;
		// If href is already absolute (http/https), javascript:, or #, keep it as is
		if (href.startsWith('http') || href.startsWith('javascript') || href === '#' || href === '') {
			return link;
		}
		// Prepend appUrl to relative paths
		link.href = `${APP_URL}${href}`;
		return link;
	});

	return {
		name: COMPONENT_NAME,
		template: COMPONENT_TEMPLATE,
		data: processedLinks,
	};
}
