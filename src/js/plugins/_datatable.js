import { emit } from '../core/event.js';
import isNumber from 'lodash/isNumber';

export default {
	$element: null,
	name: 'datatable',
	defaultOpt: {
		columns: [],
		data: null,
		maxcount: -1,
		nodatatemplate: null,
		hidetext: 'See More',
		initafter: null,
	},
	initBefore: null,
	init: function ($this, opt, exportObj) {
		let $thead = $('<thead></thead>');
		let $colgroup = $('<colgroup></colgroup>');
		let $tbody = $('<tbody></tbody>');
		let $tfoot = $('<tfoot></tfoot>');
		let $table;
		let _getRawValue = function (value, column) {
			switch (column.type) {
				case 'date':
					return +new Date(value) || 0;
				case 'number':
					if (value.replace) {
						value = value.replace(/[^0-9.]/g, '');
					}
					return value * 1 || 0;
				default:
					return value;
			}
		};
		let _getDisplayText = function (value, column) {
			switch (column.type) {
				case 'number':
					if (isNumber(value)) {
						return column.format ? value.toFixed(column.format * 1) : value;
					} else {
						return '';
					}
				case 'string':
					return $.htmlencode(value);
				case 'date':
					let time = new Date(value);
					return time.toLocaleDateString('en-US');
				default:
					return value;
			}
		};

		let _sort = function (column, isDesc) {
			if (opt.data && opt.data.length) {
				if (isDesc) {
					opt.data = opt.data.sort(function (a, b) {
						return _getRawValue(a[column.key], column) >
							_getRawValue(b[column.key], column)
							? 1
							: -1;
					});
				} else {
					opt.data = opt.data.sort(function (a, b) {
						return _getRawValue(a[column.key], column) <
							_getRawValue(b[column.key], column)
							? 1
							: -1;
					});
				}
			}
			_initalTbody();
			if (!$tfoot.querySelectorAll('td').is(':hidden')) {
				_initalTfoot();
			}
		};
		let _initalThead = function () {
			$thead.empty();
			$colgroup.empty();
			if (opt.columns && opt.columns.length) {
				let $tr = $('<tr></tr>');
				for (let j = 0; j < opt.columns.length; j++) {
					let column = opt.columns[j];
					let display = column.display !== undefined ? column.display : column.key;

					let $td = $('<th></th>');
					if (column.sortable) {
						let $link = $(
							'<button type="button:;" class="datatable-sort">' +
							display +
							'</button>',
						);
						$link.data('column', column);
						$link.addEventListener('click', function () {
							let $this = $(this);
							let isDesc = $this.classList.contains('desc');
							_sort($this.data('column'), isDesc);
							$thead.querySelectorAll('.active').classList.remove('active');
							$this.toggleClass('desc').classList.add('active');
						});
						$td.append($link);
					} else {
						$td.html(display);
					}
					if (column.width) {
						$colgroup.append('<col width="' + column.width + '"/>');
					} else {
						$colgroup.append('<col/>');
					}
					$tr.append($td);
				}
				$thead.append($tr);
			}
			return [$colgroup, $thead];
		};
		let _initalTbody = function () {
			$tbody.empty();
			if (opt.data && opt.data.length) {
				for (let i = 0; i < opt.data.length; i++) {
					let rowData = opt.data[i];
					let $tr = $('<tr></tr>');
					for (let j = 0; j < opt.columns.length; j++) {
						let column = opt.columns[j];
						let value = rowData[column.key];
						if (!column.template) {
							value = _getDisplayText(value, column);
						} else {
							value = $.renderHtml(column.template, rowData);
						}
						$tr.append('<td>' + value + '</td>');
					}
					$tbody.append($tr);
				}
			} else {
				if (opt.nodatatemplate) {
					let tmpRow = $(
						'<tr class="no-result"><td colspan="' +
						opt.columns.length +
						'">' +
						opt.nodatatemplate +
						'</td></tr>',
					);
					$tbody.append(tmpRow);
				}
			}
			return $tbody;
		};
		let _initalTfoot = function () {
			$tfoot.empty();
			if (opt.maxcount > 0 && opt.data.length > opt.maxcount) {
				let $tr = $('<tr></tr>');
				let $link = $(
					'<td colspan="' +
					opt.columns.length +
					'"><button type="button" class="link" >' +
					opt.hidetext +
					'</button></td>',
				);
				$tbody
					.querySelectorAll('tr')
					.eq(opt.maxcount - 1)
					.nextAll()
					.hide();
				$link.addEventListener('click', function () {
					$tbody
						.querySelectorAll('tr')
						.eq(opt.maxcount - 1)
						.nextAll()
						.show();
					$(this).hide();
				});
				$tr.append($link);
				$tfoot.append($tr);
			}
			return $tfoot;
		};
		let _initTable = (exportObj._initTable = function () {
			//todo send context to the follow method, otherwise the opt will not update
			if (opt.data && opt.data.length) {
				$table = $('<table class="datatable"></table>');
				$table.append(_initalThead());
				$table.append(_initalTbody());
				$this.empty().append($table);
				$table.append(_initalTfoot());
			}
		});
		_initTable();
	},
	setOptionsBefore: null,
	setOptionsAfter: function ($this, opt, exportObj) {
		exportObj._initTable();
	},
	destroyBefore: function ($this, opt, exportObj) {
		$this.remove();
	},
	initAfter: function ($this, opt, exportObj) {
		opt.initafter && emit(opt.initafter, $this, opt, exportObj);
	},
};
