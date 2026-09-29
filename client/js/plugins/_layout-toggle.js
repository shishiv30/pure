import { Plugin } from '../core/plugin.js';

export default {
	name: 'layout-toggle',
	defaultOpt: {
		target: '',
		model: 'default',
	},
	init: function ($el, opt) {
		$el.addEventListener('click', () => {
			const target = document.getElementById(opt.target);
			if (!target) {
				return;
			}
			const layout = Plugin.getInstance(target, 'layout');
			if (!layout || !layout.setModel) {
				return;
			}
			layout.setModel(opt.model);
			document.querySelectorAll(`[data-role~="layout-toggle"][data-target="${opt.target}"]`).forEach((button) => {
				button.classList.toggle('active', button === $el);
			});
		});
	},
	initBefore: null,
};
