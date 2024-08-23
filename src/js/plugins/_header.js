import { emit, off, on } from '../core/event.js';
import guid from '../core/guid.js';

export default {
	name: 'header',
	defaultOpt: {
		container: 'html',
		autoclose: true,
	},
	init: function ($this, opt, exportObj) {
		let $list = $this.querySelector('.header-menu-list');
		let $dropdown = $list.querySelectorAll('.list');
		let $overlay = document.createElement('div');
		$overlay.setAttribute('class', 'header-overlay');
		let $swtichLink = $this.querySelectorAll('.header-switch-link');
		opt.id = guid;
		$this.prepend($overlay);
		let _close = function () {
			$this.classList.add('header-close');
		};
		let _open = function () {
			$this.classList.remove('header-close');
		};
		let _show = function () {
			document.body.classList.add('body-expand-header');
		};
		let _hide = function () {
			document.body.classList.remove('body-expand-header');
			$list.querySelectorAll('li').forEach((e) => {
				e.classList.remove('hover');
				e.style.height = '';
			});
		};
		$overlay.addEventListener('click', _hide);
		//nav
		$dropdown.forEach(function (list) {
			let $arrow = document.createElement('button');
			$arrow.setAttribute('type', 'button');
			$arrow.setAttribute('class', 'header-expand');
			$arrow.innerHTML = '<i class="icon-caret-left"></i>';
			$arrow.addEventListener('click', function (e) {
				//get partent
				let $li = list;
				if ($li.classList.contains('hover')) {
					$li.classList.remove('hover');
					$li.style.height = '';
				} else {
					let hoverItem = $list.querySelector('.list.hover');
					if (hoverItem) {
						hoverItem.classList.remove('hover');
						hoverItem.style.height = '';
					}
					$li.classList.add('hover');
					$li.style.height = $li.scrollHeight + 'px';
				}
			});
			list.append($arrow);
		});
		$swtichLink.forEach((e) => {
			e.addEventListener('click', () => {
				if (document.body.classList.contains('body-expand-header')) {
					_hide();
				} else {
					_show();
				}
			});
		});
		exportObj.show = _show;
		exportObj.hide = _hide;
		exportObj.close = _close;
		exportObj.open = _open;
		on('dom.resize.header' + opt.id, _hide);
		on('dom.scroll.header' + opt.id, (status) => {
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
		off('dom.resize.header' + opt.id);
		off('dom.scroll.header' + opt.id);
	},
};
