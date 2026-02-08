//validate for form submit
import { emit, trigger } from '../core/event.js';
import { Plugin } from '../core/plugin.js';
export const getElementValue = function ($element) {
	if ($element.type === 'checkbox') {
		let value = $element.attributes['value'];
		if ($element.checked) {
			return value ? value : 'on';
		} else {
			return '';
		}
	}
	if ($element.type === 'radio') {
		let value = $element.attributes['value'];
		if ($element.checked) {
			return value ? value : 'on';
		} else {
			return '';
		}
	}
	return $element.value;
};
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
			$el.querySelectorAll('input').forEach(function (item, index) {
				let name = item.name;
				if (['radio', 'checkbox'].includes(item.type)) {
					return;
				}
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
				let checkbox;
				let checkboxList;
				checkboxList = item.querySelectorAll('input[type="checkbox"]');
				if (checkboxList && checkboxList.length > 0) {
					let name = checkboxList[0].name;
					if (name) {
						if (checkboxList && checkboxList.length === 1) {
							checkbox = checkboxList[0];
							if (checkbox && checkbox.checked) {
								obj[name] = checkbox.value ? checkbox.value : true;
							} else {
								obj[name] = checkbox.value ? '' : false;
							}
						} else if (checkboxList && checkboxList.length > 1) {
							obj[name] = [];
							checkboxList = checkboxList.forEach((item) => {
								if (item && item.checked) {
									obj[name].push(item.value);
								}
							});
						}
					}
				}
			});
			$el.querySelectorAll('.radio').forEach((item) => {
				let radioItem = item.querySelectorAll('input[type="radio"]');
				if (radioItem && radioItem.length > 0) {
					let name = radioItem[0].name;
					if (name) {
						obj[name] = '';
						radioItem.forEach((item) => {
							if (item && item.checked) {
								obj[name] = item.value ? item.value : true;
							}
						});
					}
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
