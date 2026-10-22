import { getPagination } from '../../helpers/pagination.js';

const COMPONENT_NAME = 'pagination';
const COMPONENT_TEMPLATE = 'comp_pagination';

/**
 * Create the pagination UI component config.
 * @param {Parameters<typeof getPagination>[0]} options — total, path, search, index, size
 * @returns {{ name: string, template: string, data: ReturnType<typeof getPagination> }}
 */
export function createPaginationComponent(options) {
	return {
		name: COMPONENT_NAME,
		template: COMPONENT_TEMPLATE,
		data: getPagination(options),
	};
}
