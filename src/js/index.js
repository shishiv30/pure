import Page from './core/page';
import plugins from './plugins';
import Plugin from './core/plugin';

export default function (frame) {
	const root = frame || window;
	for (var key in plugins) {
		new Plugin(plugins[key]);
	}
	if (!root.ctx) {
		root.ctx = {};
	}
	let page = new Page(root.ctx);
	let $ = page.init();
	Object.assign(root, { $ });
}
