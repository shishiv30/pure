import { emit } from '../core/event.js';
let customValidate = {
	max: function ($element) {
		let value = $element.val();
		let max = $element.attr('data-max');
		let a = $.isNumeric(value) ? value : Date.parse(value);
		let b = $.isNumeric(max) ? max : Date.parse(max);
		return a - b <= 0;
	},
	less: function ($element) {
		let value = $element.val();
		let less = $element.attr('data-less');
		let a = $.isNumeric(value) ? value : Date.parse(value);
		let b = $.isNumeric(less) ? less : Date.parse(less);
		return a - b < 0;
	},
	min: function ($element) {
		let value = $element.val();
		let min = $element.attr('data-min');
		let a = $.isNumeric(value) ? value : Date.parse(value);
		let b = $.isNumeric(min) ? min : Date.parse(min);
		return a - b >= 0;
	},
	greater: function ($element) {
		let value = $element.val();
		let greater = $element.attr('data-greater');
		let a = $.isNumeric(value) ? value : Date.parse(value);
		let b = $.isNumeric(greater) ? greater : Date.parse(greater);
		return a - b > 0;
	},
};
let _showValidate = function ($element, message) {
	$element.closest('.input').classList.remove('has-success');
	$element.closest('.input').classList.add('has-error');
	if (message) {
		$element
			.closest('.input')
			.cui_tooltip({
				once: true,
				type: 'error',
				content: message,
				placement: 'top',
				trigger: null,
				theme: 'error',
			})
			.show();
	}
};
let _passValidate = function ($element, isRequried) {
	if ($element.closest('.input').data('tooltip')) {
		$element.closest('.input').data('tooltip').hide();
	}
	$element.closest('.input').classList.remove('has-error');
	if ($element.is('[id]')) {
		$('[for=' + $element.attr('id') + ']').classList.remove('error-text');
	}
	if (isRequried) {
		$element.closest('.input').classList.add('has-success');
	} else if ($element.val()) {
		$element.closest('.input').classList.add('has-success');
	} else {
		$element.closest('.input').classList.remove('has-success');
	}
};
let _validate = function ($element, type, errorText, addition) {
	let value = $.trim($element.val());
	let isRequired = type.indexOf('required') >= 0;
	let message = '';
	for (let i = 0; i < type.length; i++) {
		switch (type[i]) {
			case 'required':
				if (!value && value === '') {
					message = 'This is requried';
					_showValidate($element, message);
					return false;
				}
				break;
			case 'email':
				if (value && !$.isEmail(value)) {
					message = errorText || 'Invalid Email.';
					_showValidate($element, message);
					return false;
				}
				break;
			case 'phone':
				if (value && !$.isPhone(value)) {
					message = errorText || 'Invalid Phone Number';
					_showValidate($element, message);
					return false;
				}
				break;
			case 'zipcode':
				if (value && !$.isZipcode(value)) {
					message = errorText || 'Invalid Zipcode';
					_showValidate($element, message);
					return false;
				}
				break;
			case 'price':
				if (value && !$.isPrice(value)) {
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
	init: function ($this, opt, exportObj) {
		opt.type = opt.type ? opt.type.split(',') : [];
		$this.on('change.validate', function () {
			_validate($this, opt.type, opt.errortext, opt.addition);
		});
		exportObj.isValid = function () {
			return _validate($this, opt.type, opt.errortext, opt.addition);
		};
	},
	setOptionsBefore: function (e, context, options) {
		options.validate = options.validate ? options.validate.split(',') : [];
	},
	setOptionsAfter: function ($this, opt, exportObj) {
		$this.off('change.validate').on('change.validate', function () {
			_validate($this, opt.type, opt.errortext, opt.addition);
		});
	},
	destroyBefore: function ($this, opt, exportObj) {
		$this.off('change.validate');
	},
	initAfter: null,
};
