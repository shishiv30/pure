//validate for form submit
import { emit, trigger } from '../core/event.js';
import Plugin from '../core/plugin.js';
export default {
	name: 'form',
	defaultOpt: {
		onsubmit: null,
	},
	initBefore: null,
	init: function ($el, opt, exportObj) {
		exportObj.isValid = function () {
			let foucsElement = null;
			let isPassed = true;
			$el.querySelectorAll('[data-role*="validate"]').forEach(function (item, index) {
				let validateObj = Plugin.getInstance(item, 'validate');
				if (!validateObj) {
					return true;
				}
				//todo check isvalide
				let isValide = validateObj.isValid();
				if (!isValide) {
					isPassed = false;
					if (!foucsElement) {
						foucsElement = item;
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
			$el.querySelectorAll('input[type="tel"]').forEach(function (item, index) {
				let name = item.name;
				if (name) {
					obj[name] = item.value;
				}
			});
			$el.querySelectorAll('input[type="email"]').forEach(function (item, index) {
				let name = item.name;
				if (name) {
					obj[name] = item.value;
				}
			});
			$el.querySelectorAll('input[type="text"]').forEach(function (item, index) {
				let name = item.name;
				if (name) {
					obj[name] = item.value;
				}
			});
			$el.querySelectorAll('input[type="number"]').forEach(function (item, index) {
				let name = item.name;
				if (name) {
					obj[name] = item.value;
				}
			});
			$el.querySelectorAll('input[type="password"]').forEach(function (item, index) {
				let name = item.name;
				if (name) {
					obj[name] = item.value;
				}
			});
			$el.querySelectorAll('input[type="hidden"]').forEach(function (item, index) {
				let name = item.name;
				if (name) {
					obj[name] = item.value;
				}
			});
			$el.querySelectorAll('textarea').forEach(function (item, index) {
				let name = item.name;
				if (name) {
					obj[name] = item.value;
				}
			});
			$el.querySelectorAll('select').forEach(function (item, index) {
				let name = item.name;
				if (name) {
					obj[name] = item.value;
				}
			});
			$el.querySelectorAll('.checkbox').forEach(function (item, index) {
				let name;
				let checkbox;
				let checkboxList;
				if (item.dataset.type == 'single') {
					checkbox = item.querySelectorAll(':checkbox');
					if (checkbox.length) {
						name = checkbox.name;
						if (checkbox.is(':checked')) {
							obj[name] = checkbox.value ? checkbox.value : true;
						} else {
							obj[name] = checkbox.value ? '' : false;
						}
					}
				} else {
					checkboxList = item.querySelectorAll(':checked');
					name = checkboxList.name;
					if (name) {
						obj[name] = $.map(checkboxList, function (item) {
							return item.value;
						});
					}
				}
			});
			$el.querySelectorAll('.radio').forEach(function (item, index) {
				let radioItem = item.querySelectorAll(':checked');
				let name = radioItem.name;
				if (name) {
					obj[name] = $(radioItem).value;
				}
			});
			return obj;
		};
		$el.addEventListener("submit", (event) => {
			event.preventDefault();
			let valide;
			try {
				valide = exportObj.isValid();
			} catch (e) {
				console.error(e);
			}
			if (!valide) {
				return;
			}
			let payload = exportObj.getValue();
			trigger(opt.onsubmit, payload);
		});

		return exportObj;
	},
	setOptionsBefore: null,
	setOptionsAfter: null,
	destroyBefore: null,
	initAfter: null,
};
// $.cui.plugin(formConfig);
// $(document).addEventListener('dom.load', function () {
//     $('[data-form]').forEach(function (item, index) {
//         let $el = item;
//         let data = $el.data();
//         $el.remov.dataset.form;
//         $el.form(data);
//         $el.attr('data-form-load', '');
//     });
// });
