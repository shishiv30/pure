const COMPONENT_NAME = 'points';
const COMPONENT_TEMPLATE = 'comp_points';

/**
 * Create the points UI component config.
 * @param {object} data - Resolved points data (image.src full URL, ctaHref full URL)
 * @returns {{ name: string, template: string, data: object }}
 */
export function createPointsComponent(data) {
	return {
		name: COMPONENT_NAME,
		template: COMPONENT_TEMPLATE,
		data,
	};
}
