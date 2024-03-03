import { emit } from '../core/event.js';
import isNumber from 'lodash/isNumber.js';
import { isPhoneNumber, isEmail, isZipcode, isPrice } from '../core/validate.js';
import { formatTrim } from '../core/format.js';
let customValidate = {
	max: function ($element) {
		let value = $element.value;
		let max = $element.dataset('max');
		let a = isNumber(value) ? value : Date.parse(value);
		let b = isNumber(max) ? max : Date.parse(max);
		return a - b <= 0;
	},
	less: function ($element) {
		let value = $element.value;
		let less = $element.dataset('less');
		let a = isNumber(value) ? value : Date.parse(value);
		let b = isNumber(less) ? less : Date.parse(less);
		return a - b < 0;
	},
	min: function ($element) {
		let value = $element.value;
		let min = $element.dataset('min');
		let a = isNumber(value) ? value : Date.parse(value);
		let b = isNumber(min) ? min : Date.parse(min);
		return a - b >= 0;
	},
	greater: function ($element) {
		let value = $element.value;
		let greater = $element.dataset('greater');
		let a = isNumber(value) ? value : Date.parse(value);
		let b = isNumber(greater) ? greater : Date.parse(greater);
		return a - b > 0;
	},
};
let _showValidate = function ($element, message) {
	$element.closest('.input').classList.remove('has-success');
	$element.closest('.input').classList.add('has-error');
	if (message) {
		$element.closest('.input').dataset.tooltip = message;
	}
};
let _passValidate = function ($element, isRequried) {
	if ($element.closest('.input').dataset.tooltip) {
		delete $element.closest('.input').dataset.tooltip;
	}
	$element.closest('.input').classList.remove('has-error');
	if ($element.id) {
		document.querySelector('[for=' + $element.id + ']').classList.remove('error-text');
	}
	if (isRequried) {
		$element.closest('.input').classList.add('has-success');
	} else if ($element.value) {
		$element.closest('.input').classList.add('has-success');
	} else {
		$element.closest('.input').classList.remove('has-success');
	}
};
let _validate = function ($element, type, errorText, addition) {
	let value = formatTrim($element.value);
	let isRequired = type.indexOf('required') >= 0;
	let message = '';
	for (let i = 0; i < type.length; i++) {
		switch (type[i]) {
			case 'required':
				if (value === '') {
					message = '* requried';
					_showValidate($element, message);
					return false;
				}
				break;
			case 'email':
				if (value && !isEmail(value)) {
					message = errorText || 'Invalid Email.';
					_showValidate($element, message);
					return false;
				}
				break;
			case 'phone':
				if (value && !isPhoneNumber(value)) {
					message = errorText || 'Invalid Phone Number';
					_showValidate($element, message);
					return false;
				}
				break;
			case 'zipcode':
				if (value && !isZipcode(value)) {
					message = errorText || 'Invalid Zipcode';
					_showValidate($element, message);
					return false;
				}
				break;
			case 'price':
				if (value && !isPrice(value)) {
					message = errorText || 'Invalid Price';
					_showValidate($element, message);
					return false;
				}
				break;
			default:
				break;
		}
	}

	if (customValidate[addition] && !customValidate[addition]($element)) {
		_showValidate($element, message);
		return false;
	}

	_passValidate($element, isRequired);
	return true;
};
export default {
	name: 'validate',
	defaultOpt: {
		errortext: '',
		addition: null,
	},
	initBefore: null,
	init: function ($el, opt, exportObj) {
		opt.type = opt.type ? opt.type.split(',') : [];
		$el.addEventListener('change', function () {
			_validate($el, opt.type, opt.errortext, opt.addition);
		});
		exportObj.isValid = function () {
			return _validate($el, opt.type, opt.errortext, opt.addition);
		};
	},
	setOptionsBefore: function (e, context, options) {
		options.validate = options.validate ? options.validate.split(',') : [];
	},
	setOptionsAfter: function ($el, opt, exportObj) {
		$el.off('change').addEventListener('change', function () {
			_validate($el, opt.type, opt.errortext, opt.addition);
		});
	},
	destroyBefore: function ($el, opt, exportObj) {
		$el.off('change');
	},
	initAfter: null,
};
