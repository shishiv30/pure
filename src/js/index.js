import Page from './core/page';

export default function (frame) {
	const root = frame || window;
	if (!root.ctx) {
		root.ctx = {};
	}
	let page = new Page(root.ctx);
	let $ = page.init();
	Object.assign(root, { $ });
}
