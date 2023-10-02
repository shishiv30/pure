import { emit } from '../core/event.js';
export default {
	name: 'dropdownbutton',
	defaultOpt: {},
	init: function ($this, opt, exportObj) {
		let $link = $this.children('a').eq(0);
		let $icon = $this.children('a').eq(1);
		let $list = $this.querySelectorAll('.dropdown-button-list');
		$this.addEventListener('click', function (e) {
			e.stopPropagation();
		});
		exportObj.select = function ($item) {
			if ($item.closest('.dropdown-button-list').length > 0) {
				$link.appendTo($list);
				$item.prependTo($this);
				$link = $item;
				$(document).trigger('click.dropdownbutton');
			}
		};
		exportObj.close = function () {
			$list.hide();
		};
		exportObj.open = function () {
			if ($list.is(':hidden')) {
				$list.show();
				$(document).one('click.dropdownbutton', exportObj.close);
			}
		};
		$icon.addEventListener('click', exportObj.open);
		$list.querySelectorAll('a').addEventListener('click', function () {
			exportObj.select($(this));
		});
		$link.addEventListener('click', function () {
			exportObj.select($(this));
		});
	},
	setOptionsBefore: null,
	setOptionsAfter: null,
	initBefore: null,
	initAfter: null,
	destroyBefore: null,
};
// $.cui.plugin(dropdownbuttonConfig);
// $(document).addEventListener('dom.load.dropdownbutton', function () {
//     $('[data-dropdownbutton]').forEach(function (item, index) {
//         let $this = $item;
//         let data = $this.data();
//         $this.remov.dataset.dropdownbutton;
//         $this.dropdownbutton(data);
//         $this.attr('data-dropdownbutton-load', '');
//     });
// });
