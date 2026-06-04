import detailTpl from '../../../server/ejs/comp_article_detail.ejs';
import nearbyTpl from '../../../server/ejs/comp_demo_nearby.ejs';
import { renderEjsTemplate } from '../../js/core/renderEjs.js';

/**
 * @param {object} data — demo `get()` model (window.context or API `data` field)
 * @returns {string}
 */
export function buildDemoSpaInnerHtml(data) {
	if (!data?.detail) {
		return '';
	}
	const detailHtml = renderEjsTemplate(detailTpl, { detail: data.detail }, data);
	const nearbyHtml = data.articleComponent?.data?.length
		? renderEjsTemplate(nearbyTpl, { articleComponent: data.articleComponent }, data)
		: '';
	return detailHtml + nearbyHtml;
}
