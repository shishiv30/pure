import { emit, off, on } from '../core/event.js';
import guid from '../core/guid.js';
import { defBool, defEnum } from '../../js/core/def.js';
const boolStatus = ['header-close'];

export default {
	name: 'header',
	defaultOpt: {
		container: 'html',
		autoclose: true,
	},
	init: function ($el, opt, exportObj) {
		boolStatus.forEach((name) => {
			defBool(name, $el, opt, exportObj);
		});
		// Theme toggle handler for .menu-img
		let $menuImg = $el.querySelector('.menu-img');
		if ($menuImg) {
			$menuImg.addEventListener('click', function (e) {
				e.preventDefault();
				document.body.classList.toggle('theme-dark');
				// Persist theme preference
				const isDark = document.body.classList.contains('theme-dark');
				localStorage.setItem('theme', isDark ? 'dark' : 'light');
			});
		}
		let $list = $el.querySelector('.header-menu-list');
		let $dropdown = $list.querySelectorAll('.list');
		let $overlay = document.createElement('div');
		$overlay.className = 'header-overlay';
		$el.prepend($overlay);
		let $swtichLink = $el.querySelectorAll('.header-switch-link');
		opt.id = guid;
		let _close = exportObj.addHeaderClose;
		let _open = exportObj.removeHeaderClose;
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
			if (status.isScrollDown) {
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
	destroyBefore: function ($el, opt) {
		off('dom.resize.header' + opt.id);
		off('dom.scroll.header' + opt.id);
	},
};
