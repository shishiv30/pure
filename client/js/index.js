import { Page } from './core/page.js';
import plugins from './plugins/index.js';
import { Plugin } from './core/plugin.js';
import { installDOMHooks } from './core/dom.hook.js';
import { Router } from './core/router.js';

//after page initied, we can use window.exportObj to see the export methods
//and use Plugin.getInstance($elment,'pluginName') to get the plugin instance
//page context is in window.exportObj.ctx
//page data is in window.exportObj.ctx.data
installDOMHooks();

const BOOT_KEY = '__pureMainPage';

/**
 * Page bootstrap. Idempotent per frame: a second call returns the existing Page
 * without re-registering plugins or re-running init (avoids duplicate Router listeners).
 * @see docs/client-js-lifecycle.md
 */
export function main(frame, settings = null) {
	const root = frame || window;
	if (root[BOOT_KEY]) {
		return root[BOOT_KEY];
	}
	for (var key in plugins) {
		new Plugin(plugins[key]);
	}
	if (!root.ctx) {
		root.ctx = {};
	}
	let page = new Page(root.ctx, settings);
	root[BOOT_KEY] = page;
	page.init().then((exportObj) => {
		Object.assign(root, { exportObj, Plugin: Plugin });
	});
	return page;
}

/**
 * Clear boot guard and destroy active Router (e.g. webpack HMR dispose).
 */
export function resetMain(frame) {
	const root = frame || window;
	if (Router.active) {
		Router.active.destroy();
	}
	delete root[BOOT_KEY];
}

if (typeof import.meta !== 'undefined' && import.meta.webpackHot) {
	import.meta.webpackHot.dispose(() => {
		resetMain(window);
	});
} else if (typeof module !== 'undefined' && module.hot) {
	module.hot.dispose(() => {
		resetMain(window);
	});
}
