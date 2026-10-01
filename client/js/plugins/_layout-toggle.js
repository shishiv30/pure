import { Plugin } from '../core/plugin.js';

export default {
	name: 'layout-toggle',
	defaultOpt: {
		target: '',
		model: 'default',
	},
	init: function ($el, opt) {
		$el.addEventListener('change', () => {
			if (!$el.checked) {
				return;
			}
			const target = document.getElementById(opt.target);
			if (!target) {
				return;
			}
			const layout = Plugin.getInstance(target, 'layout');
			if (!layout || !layout.setModel) {
				return;
			}
			layout.setModel(opt.model);
		});
	},
	initBefore: null,
};
