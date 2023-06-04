import { trigger } from '../core/event.js';
import { select } from '../core/query.js';
export default {
	name: 'collapse',
	defaultOpt: {
		shown: false,
		showbefore: null,
		showafter: null,
		hidebefore: null,
		hideafter: null,
		target: null,
	},
	init: function ($el, opt, exportObj) {
		let $target = select(opt.target);

		exportObj.show = function () {
			opt.showbefore && trigger(opt.showbefore, $el, opt, exportObj);
			$el.classList.add('shown');
			$target.classList.add('shown');
			exportObj.shown = true;
			opt.showafter && trigger(opt.showafter, $el, opt, exportObj);
		};
		exportObj.hide = function () {
			opt.hidebefore && trigger(opt.hidebefore, $el, opt, exportObj);
			$el.classList.remove('shown');
			$target.classList.remove('shown');
			exportObj.shown = false;
			opt.hideafter && trigger(opt.hideafter, $el, opt, exportObj);
		};

		exportObj.toggle = function () {
			if ($el.classList.contains('shown')) {
				exportObj.hide();
			} else {
				exportObj.show();
			}
		};
	},
	setOptionsBefore: null,
	setOptionsAfter: null,
	initBefore: null,
	initAfter: function ($el, opt, exportObj) {
		if (opt.shown) {
			exportObj.show();
		} else {
			exportObj.hide();
		}
		$el.addEventListener('click', exportObj.toggle);
	},
	destroyBefore: function ($el) {
		$el.off('click.collapse');
	},
};
