import { emit } from '../core/event.js';
import isNumber from 'lodash/isNumber';
import validate from '../core/validate.js';
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
	if ($element.is('[id]')) {
		$('[for=' + $element.attr('id') + ']').classList.remove('error-text');
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
	let value = $.trim($element.value);
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
				if (value && !validate.isEmail(value)) {
					message = errorText || 'Invalid Email.';
					_showValidate($element, message);
					return false;
				}
				break;
			case 'phone':
				if (value && !validate.isPhone(value)) {
					message = errorText || 'Invalid Phone Number';
					_showValidate($element, message);
					return false;
				}
				break;
			case 'zipcode':
				if (value && !validate.isZipcode(value)) {
					message = errorText || 'Invalid Zipcode';
					_showValidate($element, message);
					return false;
				}
				break;
			case 'price':
				if (value && !validate.isPrice(value)) {
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
		$el.on('change.validate', function () {
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
		$el.off('change.validate').on('change.validate', function () {
			_validate($el, opt.type, opt.errortext, opt.addition);
		});
	},
	destroyBefore: function ($el, opt, exportObj) {
		$el.off('change.validate');
	},
	initAfter: null,
};
