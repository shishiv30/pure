const COMPONENT_NAME = 'timeline';
const COMPONENT_TEMPLATE = 'comp_timeline';

/**
 * Create the timeline UI component config.
 * @param {object} data - Timeline data (heading, intro, entries)
 * @returns {{ name: string, template: string, data: object }}
 */
export function createTimelineComponent(data) {
	return {
		name: COMPONENT_NAME,
		template: COMPONENT_TEMPLATE,
		data,
	};
}
