import { Page } from './core/page.js';
import plugins from './plugins/index.js';
import { Plugin } from './core/plugin.js';
import { installDOMHooks } from './core/dom.hook.js';

//after page initied, we can use window.exportObj to see the export methods
//and use Plugin.getInstance($elment,'pluginName') to get the plugin instance
//page context is in window.exportObj.ctx
//page data is in window.exportObj.ctx.data
installDOMHooks();
export function main(frame, settings = null) {
	const root = frame || window;
	for (var key in plugins) {
		new Plugin(plugins[key]);
	}
	if (!root.ctx) {
		root.ctx = {};
	}
	let page = new Page(root.ctx, settings);
	page.init().then((exportObj) => {
		Object.assign(root, { exportObj, Plugin: Plugin });
	});
	return page;
}
