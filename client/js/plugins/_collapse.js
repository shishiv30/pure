import { trigger } from '../core/event.js';
export default {
	name: 'collapse',
	defaultOpt: {
		shown: false,
		beforeShow: null,
		afterShow: null,
		beforeHide: null,
		afterHide: null,
		target: null,
	},
	init: function ($el, opt, exportObj) {
		let $target = document.querySelector(opt.target);

		exportObj.show = function () {
			opt.beforeShow && trigger(opt.beforeShow, $el, opt, exportObj);
			$el.classList.add('shown');
			$target.classList.add('shown');
			exportObj.shown = true;
			opt.afterShow && trigger(opt.afterShow, $el, opt, exportObj);
		};
		exportObj.hide = function () {
			opt.beforeHide && trigger(opt.beforeHide, $el, opt, exportObj);
			$el.classList.remove('shown');
			$target.classList.remove('shown');
			exportObj.shown = false;
			opt.afterHide && trigger(opt.afterHide, $el, opt, exportObj);
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
