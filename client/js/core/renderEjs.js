import { createEjsRenderContext } from '../../../helpers/ejsRenderContext.js';

/**
 * Render a webpack-compiled EJS module with template locals and page model.
 * @param {{ render: (locals: object) => string }} compiledModule — default import from *.ejs
 * @param {object} templateLocals — e.g. { detail }, { articleComponent }
 * @param {object} model — full page data (appHost, cdnHost, …)
 * @returns {string}
 */
export function renderEjsTemplate(compiledModule, templateLocals, model) {
	const base = createEjsRenderContext(model);
	return compiledModule.render({ ...base, ...templateLocals });
}
