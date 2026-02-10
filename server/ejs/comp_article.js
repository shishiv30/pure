const COMPONENT_NAME = 'article';
const COMPONENT_TEMPLATE = 'comp_article';

/**
 * Create the article UI component config.
 * @param {Array<object>} articlesData
 * @returns {{ name: string, template: string, data: Array<object> }}
 */
export function createArticleComponent(articlesData) {
	return {
		name: COMPONENT_NAME,
		template: COMPONENT_TEMPLATE,
		data: articlesData || [],
	};
}

