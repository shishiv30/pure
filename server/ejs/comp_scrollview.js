const COMPONENT_NAME = 'scrollview';
const COMPONENT_TEMPLATE = 'comp_scrollview';

/**
 * Create the scrollview UI component config.
 * @param {object} data - Resolved scrollview data (links[].href full URL)
 * @returns {{ name: string, template: string, data: object }}
 */
export function createScrollviewComponent(data) {
	return {
		name: COMPONENT_NAME,
		template: COMPONENT_TEMPLATE,
		data,
	};
}
