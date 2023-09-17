import { trigger, emit, on, off } from '../core/event.js';
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
			emit('dialog.hidden.except', [opt._pid]);
			opt.showbefore && trigger(opt.showbefore, $el, opt, exportObj);
			document.querySelector('body').classList.add('dialog-model');
			opt.root.style.display = 'block';
			setTimeout(function () {
				opt.root.classList.add('dialog-active');
				opt.showafter && trigger(opt.showafter, $el, opt, exportObj);
			}, 50);
			on('dialog.hidden.except' + opt._pid, function (e, id) {
				if (id != opt._pid) {
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
					document.querySelector('body').classList.remove('dialog-model');
					opt.hideafter && trigger(opt.hidebefore, $el, opt, exportObj);
					if (!opt.cache) {
						opt.root.remove();
						opt.root = null;
						off('dialog.hidden.except' + opt._pid, function (e, id) {
							if (id != opt._pid) {
								exportObj.hide();
							}
						});
					}
				}, 500);
			}
		});
		let _render = (exportObj.render = function () {
			let template = `<div id="${opt._pid}" class="dialog dialog-${opt.theme}" tabIndex="-1"><div class="dialog-overlay"></div><div class="dialog-panel"><div class="dialog-body"><button class="dialog-title-close" data-dialog="close" type="button"><i class="icon-close"></i></button>${opt.html}</div></div>`;
			emit('dom.load');
			opt.renderbefore && trigger(opt.renderbefore, $el, opt, exportObj);
			//todo use append to insert template as html
			document.querySelector('body').insertAdjacentHTML('beforeend', template);
			opt.root = document.querySelector('#' + opt._pid);
			opt.root.style.display = 'none';

			opt.root.querySelectorAll('[data-dialog="close"]').forEach((item) => {
				item.addEventListener('click', function () {
					_hide();
				});
			});

			if (opt.autoclose) {
				opt.root.querySelector('.dialog-overlay').addEventListener('click', function () {
					_hide();
				});
			}
			opt.renderafter && trigger(opt.renderafter, $el, opt, exportObj);
		});
		$el.addEventListener('click', function (e) {
			let data = e.currentTarget.dataset;
			let $target = document.querySelector(data.target);
			opt.html = $target.innerHTML;
			data.trigger = e.target;
			_show();
			return false;
		});
	},
	setOptionsBefore: null,
	setOptionsAfter: null,
	initBefore: null,
	initAfter: function ($el, opt, exportObj) { },
	destroyBefore: function ($el) { },
};
