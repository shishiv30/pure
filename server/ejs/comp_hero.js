const COMPONENT_NAME = 'hero';
const COMPONENT_TEMPLATE = 'comp_hero';

/**
 * Create the hero UI component config.
 * @param {object} data - Resolved hero data (image.src full URL, etc.)
 * @returns {{ name: string, template: string, data: object }}
 */
export function createHeroComponent(data) {
	return {
		name: COMPONENT_NAME,
		template: COMPONENT_TEMPLATE,
		data,
	};
}
