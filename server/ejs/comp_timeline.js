const COMPONENT_NAME = 'timeline';
const COMPONENT_TEMPLATE = 'comp_timeline';

const timelineData = {
	heading: 'Project timeline',
	intro: 'Key milestones in the introduction and evolution of the Pure UI project.',
	entries: [
		{ type: 'title', label: 'Feb 2026' },
		{ type: 'desc', date: 'Feb 10, 2026', text: 'Infra build with AWS' },
		{ type: 'desc', date: 'Feb 2, 2026', text: 'Add AI code review' },
		{ type: 'title', label: 'Jan 2026' },
		{ type: 'desc', date: 'Jan 24, 2026', text: 'Add workflow for build GH page' },
		{ type: 'title', label: 'Dec 2025' },
		{ type: 'desc', date: 'Dec 11, 2025', text: 'Remove jQuery' },
		{ type: 'title', label: 'Oct 2025' },
		{ type: 'desc', date: 'Oct 12, 2025', text: 'Introduce web component' },
		{ type: 'title', label: 'Sep 2025' },
		{ type: 'desc', date: 'Sep 7, 2025', text: 'Build page system' },
		{ type: 'title', label: 'Aug 2025' },
		{ type: 'desc', date: 'Aug 3, 2025', text: 'Refactor core and plugin' },
		{ type: 'title', label: 'Jun 2025' },
		{ type: 'desc', date: 'Jun 9, 2025', text: 'Ability to call SOA' },
	],
};

/**
 * Create the timeline UI component config.
 * @returns {{ name: string, template: string, data: object }}
 */
export function createTimelineComponent() {
	return {
		name: COMPONENT_NAME,
		template: COMPONENT_TEMPLATE,
		data: timelineData,
	};
}
