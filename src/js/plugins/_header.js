export default {
	name: 'header',
	defaultOpt: {
		container: 'html',
		autoclose: true,
	},
	init: function ($this, opt, exportObj) {
		let $body = $('body');
		let $list = $this.find('.header-menu-list');
		let $dropdown = $list.find('.list');
		let $overlay = $('<div class="header-overlay"></div>');
		let $swtichLink = $this.find('.header-switch-link');
		opt.id = $.guid++;
		$this.prepend($overlay);
		let _close = function () {
			$this.classList.add('header-close');
		};
		let _open = function () {
			$this.classList.remove('header-close');
		};
		let _show = function () {
			$body.classList.add('body-expand-header');
		};
		let _hide = function () {
			$body.classList.remove('body-expand-header');
			$list.find('li').classList.remove('hover').css('height', '');
		};
		$overlay.on('click', _hide);
		//nav
		$dropdown.each(function () {
			let $arrow = $(
				'<button type="button:;" class="header-expand"><i class="icon-caret-left"></i></button>',
			);
			$arrow.on('click', function () {
				let $li = $(this).closest('li');
				let $prev = $li.siblings('.hover');
				$prev.classList.remove('hover');
				$prev.css('height', '');
				if ($li.classList.contains('hover')) {
					$li.classList.remove('hover');
					$li.css('height', '');
				} else {
					$li.classList.add('hover');
					$li.css('height', $li.prop('scrollHeight'));
				}
			});
			$(this).append($arrow);
		});
		$swtichLink.on('click', function () {
			if ($body.classList.contains('body-expand-header')) {
				_hide();
			} else {
				_show();
			}
		});
		exportObj.show = _show;
		exportObj.hide = _hide;
		exportObj.close = _close;
		exportObj.open = _open;
		$(document).on('dom.resize.header' + opt.id, _hide);
		$(document).on('dom.scroll.header' + opt.id, function () {
			let status = $.cui_state;
			if (status.isScrollDown && status.scrollTop > 500) {
				_close();
			} else {
				_open();
			}
		});
	},
	setOptionsBefore: null,
	setOptionsAfter: null,
	initBefore: null,
	initAfter: null,
	destroyBefore: function ($this, opt) {
		$(document).off('dom.resize.header' + opt.id);
		$(document).off('dom.scroll.header' + opt.id);
	},
};
