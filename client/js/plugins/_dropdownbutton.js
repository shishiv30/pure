import { once } from '../core/event.js';
import { defBool } from '../core/def.js';

export default {
	name: 'dropdownbutton',
	defaultOpt: {},
	init: function ($el, opt, exportObj) {
		defBool('open', $el, opt, exportObj);

		exportObj.select = function (item) {
			const list = $el.querySelector('.dropdown-button-list');
			const current = $el.querySelector(':scope > a:not(.dropdown-button-caret)');
			if (!item || !list || !list.contains(item) || item === current) {
				return;
			}
			if (current) {
				list.appendChild(current);
			}
			$el.insertBefore(item, $el.firstChild);
			exportObj.removeOpen();
		};

		exportObj._onRootClick = function (e) {
			e.stopPropagation();
		};
		exportObj._onCaretClick = function (e) {
			e.preventDefault();
			e.stopPropagation();
			if (exportObj.isOpen()) {
				exportObj.removeOpen();
				return;
			}
			exportObj.addOpen();
			once('click.dropdownbutton', exportObj.removeOpen);
		};
		exportObj._onListClick = function (e) {
			const item = e.target.closest('a');
			const list = $el.querySelector('.dropdown-button-list');
			if (!item || !list || !list.contains(item)) {
				return;
			}
			const href = item.getAttribute('href') || '';
			if (href === 'javascript:;' || href === '#' || href === '') {
				e.preventDefault();
				exportObj.select(item);
			}
		};
	},
	setOptionsBefore: null,
	setOptionsAfter: null,
	initBefore: null,
	initAfter: function ($el, opt, exportObj) {
		$el.addEventListener('click', exportObj._onRootClick);
		const caret = $el.querySelector('.dropdown-button-caret');
		if (caret) {
			caret.addEventListener('click', exportObj._onCaretClick);
		}
		const list = $el.querySelector('.dropdown-button-list');
		if (list) {
			list.addEventListener('click', exportObj._onListClick);
		}
	},
	destroyBefore: function ($el, opt, exportObj) {
		$el.removeEventListener('click', exportObj._onRootClick);
		const caret = $el.querySelector('.dropdown-button-caret');
		if (caret) {
			caret.removeEventListener('click', exportObj._onCaretClick);
		}
		const list = $el.querySelector('.dropdown-button-list');
		if (list) {
			list.removeEventListener('click', exportObj._onListClick);
		}
	},
	destroyAfter: null,
};
