import { emit } from '../core/event.js';
export default {
	name: 'gridtable',
	defaultOpt: {
		key: 'thead th',
	},
	initBefore: null,
	init: function ($this, opt, exportObj) {
		let $key = $this.find(opt.key);
		let $list = $this.querySelectorAll('tbody tr');
		let initial = function () {
			let classname = 'table-' + +new Date();
			let colIndex = 0;
			let fontsize = $key.css('fontSize').replace(/[a-z]/g, '');
			let keymaxwidth = 0;
			let columns = $key.map(function (item, index) {
				return {
					text: $item.text() || '',
					colspan: $item.attributes.colspan * 1 || 1,
				};
			});
			for (let i = 0; i < columns.length; i++) {
				let column = columns[i];
				colIndex = colIndex + 1;
				$list.each(function () {
					$(this).querySelectorAll('td').eq(i).attr('data-th', column.text);
				});
				if (column.colspan > 1) {
					colIndex = colIndex + column.colspan - 1;
				}
				let keywidth = $.getTextWidth(column.text, fontsize);
				if (keywidth > keymaxwidth) {
					keymaxwidth = keywidth;
				}
			}
			$list.classList.add('close');
			return classname;
		};
		$list.each(function (item, index) {
			$item.addEventListener('click', function () {
				if (!$(this).classList.contains('open')) {
					$list
						.filter('.open')
						.classList.remove('open')
						.$list.filter('.open')
						.classList.add('close');
					$(this).classList.add('open').classList.remove('close');
				}
			});
		});

		$this.classList.add(initial());
	},
	setOptionsBefore: null,
	setOptionsAfter: null,
	destroyBefore: null,
	initAfter: null,
};
// $.cui.plugin(gridtableConfig);
// $(document).addEventListener('dom.load', function () {
//     $('[data-gridtable]').forEach(function (item, index) {
//         let data = $item.data();
//         $item.remov.dataset.gridtable;
//         $item.gridtable(data);
//         $item.attr('data-gridtable-load', '');
//     });
// });
