//validate for form submit
import { emit } from '../core/event.js';
import Plugin from '../core/plugin.js';
export default {
	name: 'form',
	defaultOpt: null,
	initBefore: null,
	init: function ($el, opt, exportObj) {
		exportObj.isValid = function () {
			let foucsElement = null;
			let isPassed = true;
			$el.find('[data-role*="validate"]').each(function (index, item) {
				let validateObj = Plugin.getInstance(item, 'validate');
				if (!validateObj) {
					return true;
				}
				//todo check isvalide
				let isValide = validateObj.isValid();
				if (!isValide) {
					isPassed = false;
					if (!foucsElement) {
						foucsElement = $(item);
					}
					return false;
				}
			});
			if (foucsElement) {
				foucsElement.focus();
			}
			return isPassed;
		};
		exportObj.getValue = function () {
			let obj = {};
			$el.find(':input[type="tel"]').each(function (index, item) {
				let name = $(item).attr('name');
				if (name) {
					obj[name] = $(item).val();
				}
			});
			$el.find(':input[type="email"]').each(function (index, item) {
				let name = $(item).attr('name');
				if (name) {
					obj[name] = $(item).val();
				}
			});
			$el.find(':input[type="text"]').each(function (index, item) {
				let name = $(item).attr('name');
				if (name) {
					obj[name] = $(item).val();
				}
			});
			$el.find(':input[type="number"]').each(function (index, item) {
				let name = $(item).attr('name');
				if (name) {
					obj[name] = $(item).val();
				}
			});
			$el.find(':password').each(function (index, item) {
				let name = $(item).attr('name');
				if (name) {
					obj[name] = $(item).val();
				}
			});
			$el.find(':hidden').each(function (index, item) {
				let name = $(item).attr('name');
				if (name) {
					obj[name] = $(item).val();
				}
			});
			$el.find('textarea').each(function (index, item) {
				let name = $(item).attr('name');
				if (name) {
					obj[name] = $(item).val();
				}
			});
			$el.find('select').each(function (index, item) {
				let name = $(item).attr('name');
				if (name) {
					obj[name] = $(item).val();
				}
			});
			$el.find('.checkbox').each(function (index, item) {
				let name;
				let checkbox;
				let checkboxList;
				if ($(item).data('type') == 'single') {
					checkbox = $(item).find(':checkbox').eq(0);
					if (checkbox.length) {
						name = checkbox.attr('name');
						if (checkbox.is(':checked')) {
							obj[name] = checkbox.attr('value') ? checkbox.attr('value') : true;
						} else {
							obj[name] = checkbox.attr('value') ? '' : false;
						}
					}
				} else {
					checkboxList = $(item).find(':checkbox:checked');
					name = checkboxList.attr('name');
					if (name) {
						obj[name] = $.map(checkboxList, function (item) {
							return $(item).val();
						});
					}
				}
			});
			$el.find('.radio').each(function (index, item) {
				let radioItem = $(item).find(':radio:checked');
				let name = radioItem.attr('name');
				if (name) {
					obj[name] = $(radioItem).val();
				}
			});
			return obj;
		};
		return exportObj;
	},
	setOptionsBefore: null,
	setOptionsAfter: null,
	destroyBefore: null,
	initAfter: null,
};
// $.cui.plugin(formConfig);
// $(document).on('dom.load', function () {
//     $('[data-form]').each(function (index, item) {
//         let $el = $(item);
//         let data = $el.data();
//         $el.removeAttr('data-form');
//         $el.form(data);
//         $el.attr('data-form-load', '');
//     });
// });
