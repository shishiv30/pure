import { trigger, emit, on, off } from '../core/event.js';
import { select, selectAll } from '../core/query.js';
export default {
	name: 'dialog',
	defaultOpt: {
		cache: false,
		autoclose: true,
		theme: 'default',
		target: null,
		trigger: null,
		renderbefore: null,
		renderafter: null,
		showbefore: null,
		showafter: null,
		hidebefore: null,
		hideafter: null,
	},
	init: function ($el, opt, exportObj) {
		let _show = (exportObj.show = function () {
			if (!opt.root) {
				_render();
			}
			emit('dialog.hidden.except', [opt.nodeId]);
			opt.showbefore && trigger(opt.showbefore, $el, opt, exportObj);
			select('body').classList.add('dialog-model');
			opt.root.style.display = 'block';
			setTimeout(function () {
				opt.root.classList.add('dialog-active');
				opt.showafter && trigger(opt.showafter, $el, opt, exportObj);
			}, 50);
			on('dialog.hidden.except' + opt.nodeId, function (e, id) {
				if (id != opt.nodeId) {
					exportObj.hide();
				}
			});
		});
		let _hide = (exportObj.hide = function () {
			if (opt.root) {
				opt.hidebefore && trigger(opt.hidebefore, $el, opt, exportObj);
				opt.root.classList.remove('dialog-active');
				setTimeout(function () {
					opt.root.style.display = 'none';
					select('body').classList.remove('dialog-model');
					opt.hideafter && trigger(opt.hidebefore, $el, opt, exportObj);
					if (!opt.cache) {
						opt.root.remove();
						opt.root = null;
						off('dialog.hidden.except' + opt.nodeId, function (e, id) {
							if (id != opt.nodeId) {
								exportObj.hide();
							}
						});
					}
				}, 500);
			}
		});
		let _render = (exportObj.render = function () {
			let template = `<div id="${opt.nodeId}" class="dialog dialog-${opt.theme}" tabIndex="-1"><div class="dialog-overlay"></div><div class="dialog-panel"><div class="dialog-body"><button class="dialog-title-close" data-dialog="close" type="button"><i class="icon-close"></i></button>${opt.html}</div></div>`;
			emit('dom.load');
			opt.renderbefore && trigger(opt.renderbefore, $el, opt, exportObj);
			//todo use append to insert template as html
			select('body').insertAdjacentHTML('beforeend', template);
			opt.root = select('#' + opt.nodeId);
			opt.root.style.display = 'none';

			selectAll('[data-dialog="close"]', opt.root).forEach((item) => {
				item.addEventListener('click', function () {
					_hide();
				});
			});

			if (opt.autoclose) {
				select('.dialog-overlay', opt.root).addEventListener('click', function () {
					_hide();
				});
			}
			opt.renderafter && trigger(opt.renderafter, $el, opt, exportObj);
		});
		$el.addEventListener('click', function (e) {
			let data = e.currentTarget.dataset;
			let $target = select(data.target);
			opt.html = $target.innerHTML;
			data.trigger = e.target;
			_show();
			return false;
		});
	},
	setOptionsBefore: null,
	setOptionsAfter: null,
	initBefore: null,
	initAfter: function ($el, opt, exportObj) {},
	destroyBefore: function ($el) {},
};
