const COMPONENT_NAME = 'gallery';
const COMPONENT_TEMPLATE = 'comp_gallery';

/**
 * Create the gallery UI component config.
 * @param {object} data - Resolved gallery data (images + imagesMeta)
 * @returns {{ name: string, template: string, data: object }}
 */
export function createGalleryComponent(data) {
	return {
		name: COMPONENT_NAME,
		template: COMPONENT_TEMPLATE,
		data,
	};
}
