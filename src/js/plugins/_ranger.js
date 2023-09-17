import { emit } from '../core/event.js';
import isNumber from 'lodash/isNumber';

export default {
	name: 'ranger',
	defaultOpt: {
		max: 100,
		min: 0,
		target: null,
		step: 0,
		decimals: 0,
		connect: null,
		orientation: 'horizontal',
		start: null,
		range: null,
		changebefore: null,
		changeafter: null,
		input: [],
	},
	init: function ($this, opt, exportObj) {
		let $input = $this.querySelectorAll('input');
		let $target = opt.target ? $(opt.target) : null;
		if (!opt.connect) {
			opt.connect = [true];
			$input.each(function (index) {
				opt.connect.push(index % 2 === 1);
			});
		}
		if (!opt.start) {
			opt.start = [];
			$input.each(function () {
				opt.start.push($(this).value);
			});
		}
		let $ele = $('<div></div>');
		($target || $this).append($ele);
		noUiSlider.create($ele[0], {
			start: opt.start,
			step: opt.step,
			connect: opt.connect,
			orientation: opt.orientation,
			range: opt.range || {
				min: opt.min,
				max: opt.max,
			},
			format: {
				to: function (value) {
					return value !== undefined && value.toFixed(opt.decimals);
				},
				from: function (value) {
					return value;
				},
			},
		});
		exportObj.range = $ele[0].noUiSlider;
		exportObj.get = function () {
			return this.range.get();
		};
		exportObj.set = function (values) {
			this.range.set(values);
			let result = this.range.get();
			if (isNumber(result)) {
				result = [result];
			}
			$input.each(function (index) {
				$(this).val(result[index]).trigger('input');
			});
			return result;
		};
		$input.addEventListener('change', function () {
			let values = [];
			$input.each(function () {
				values.push($(this).value);
			});
			exportObj.set(values);
		});
		exportObj.range.addEventListener('update', function (e, t) {
			opt.changebefore && emit(opt.changebefore, $this, opt, exportObj, e, t);
			$input.each(function (index) {
				$(this).val(e[index]).trigger('input');
			});
			opt.changeafter && emit(opt.changeafter, $this, opt, exportObj, e, t);
		});
	},
	setOptionsBefore: null,
	setOptionsAfter: null,
	initBefore: null,
	initAfter: null,
	destroyBefore: null,
};
