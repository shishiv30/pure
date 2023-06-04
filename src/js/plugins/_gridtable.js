import { emit } from '../core/event.js';
export default {
	name: 'gridtable',
	defaultOpt: {
		key: 'thead th',
	},
	initBefore: null,
	init: function ($this, opt, exportObj) {
		let $key = $this.find(opt.key);
		let $list = $this.find('tbody tr');
		let inital = function () {
			let classname = 'table-' + +new Date();
			let colIndex = 0;
			let fontsize = $key.css('fontSize').replace(/[a-z]/g, '');
			let keymaxwidth = 0;
			let columns = $key.map(function (index, item) {
				return {
					text: $(item).text() || '',
					colspan: $(item).attr('colspan') * 1 || 1,
				};
			});
			for (let i = 0; i < columns.length; i++) {
				let column = columns[i];
				colIndex = colIndex + 1;
				$list.each(function () {
					$(this).find('td').eq(i).attr('data-th', column.text);
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
		$list.each(function (index, item) {
			$(item).on('click', function () {
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

		$this.classList.add(inital());
	},
	setOptionsBefore: null,
	setOptionsAfter: null,
	destroyBefore: null,
	initAfter: null,
};
// $.cui.plugin(gridtableConfig);
// $(document).on('dom.load', function () {
//     $('[data-gridtable]').each(function (index, item) {
//         let data = $(item).data();
//         $(item).removeAttr('data-gridtable');
//         $(item).gridtable(data);
//         $(item).attr('data-gridtable-load', '');
//     });
// });
