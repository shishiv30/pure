import { emit } from '../core/event.js';
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
	initBefore: null,
	init: function ($this, opt, exportObj) {
		var $dialog;
		var $dialogPanel;
		var $dialogBody;
		var $dialogOverLay;

		var _show = (exportObj.show = function () {
			if (!$dialog) {
				_render();
			}
			$(document).trigger('dialog.hidden.except', [opt.id]);
			opt.showbefore && emit(opt.showbefore, $this, opt, exportObj);
			$('html').classList.add('dialog-model');
			$dialog.show();
			setTimeout(function () {
				$dialog.classList.add('dialog-active');
				opt.showafter && emit(opt.showafter, $this, opt, exportObj);
			}, 50);
			$(document).on('dialog.hidden.except' + opt.id, function (e, id) {
				if (id != opt.id) {
					exportObj.hide();
				}
			});
		});
		var _hide = (exportObj.hide = function () {
			if ($dialog) {
				opt.hidebefore && emit(opt.hidebefore, $this, opt, exportObj);
				$dialog.classList.remove('dialog-active');
				setTimeout(function () {
					$dialog.hide();
					$('html').classList.remove('dialog-model');
					opt.hideafter && emit(opt.hidebefore, $this, opt, exportObj);
					if (!opt.cache) {
						$dialog.remove();
						$dialog = null;
						$(document).off('dialog.hidden.except' + opt.id, function (e, id) {
							if (id != opt.id) {
								exportObj.hide();
							}
						});
					}
				}, 500);
			}
		});
		var _render = (exportObj.render = function () {
			$dialog = $(`<div class="dialog dialog-${opt.theme}" tabIndex="-1"></div>`);
			$dialogPanel = $('<div class="dialog-panel"></div>');
			$dialogBody = $(
				'<div class="dialog-body"><a class="dialog-title-close" dialog-close href="javascript:;;">X</a></div>',
			);
			$dialogOverLay = $('<div class="dialog-overlay"></div>');
			$dialogPanel.append($dialogBody);
			$dialogBody.html(
				'<a class="dialog-title-close" dialog-close href="javascript:;;">X</a>',
			);
			$dialogBody.append(opt.html);
			$dialog.append($dialogPanel);
			$dialog.prepend($dialogOverLay);
			$dialogBody.find('[dialog-close]').on('click', function () {
				_hide();
			});
			if (opt.autoclose) {
				$dialogOverLay.on('click', function () {
					_hide();
				});
			}
			$dialog.hide();
			$(document).trigger('dom.load');
			opt.renderbefore && emit(opt.renderbefore, $this, opt, exportObj);
			$('html').append($dialog);
			opt.renderafter && emit(opt.renderafter, $this, opt, exportObj);
		});
		$this.on('click', function () {
			var $this = $(this);
			var data = $this.data();
			var $target = $(data.target);
			if (!opt.id) {
				opt.id = 'dialog' + data.target;
			}
			opt.html = $target.html();
			data.trigger = $this;
			_show();
			return false;
		});
	},
	setOptionsBefore: null,
	setOptionsAfter: null,
	destroyBefore: null,
	initAfter: null,
};
