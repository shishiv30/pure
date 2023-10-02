import { emit } from '../core/event.js';
export default {
	name: 'transition',
	defaultOpt: {
		type: 'number',
		from: 0,
		to: 0,
		frame: 25,
		time: 1,
		fixed: 0,
		dateformat: 'MMMM Do YYYY',
	},
	init: function ($this, opt, exportObj) {
		let start = null;
		let end = null;
		let step = null;
		let duration = null;
		let times = null;
		let format = null;
		let isIncrease = null;
		let _freshNumber = (exportObj.freshNumber = function () {
			start = opt.from * 1;
			end = opt.to * 1;
			duration = Math.floor(1000 / opt.frame);
			times = (opt.time * 1000) / duration;
			step = (end - start) / times;
			isIncrease = step > 0;
		});
		let _freshDate = (exportObj.freshDate = function () {
			start = +new Date(opt.from);
			end = +new Date(opt.to);
			duration = 1000 / opt.frame;
			times = (opt.time * 1000) / duration;
			step = (end - start) / times;
			isIncrease = step > 0;
		});
		let _fresh = (exportObj.fresh = function () {
			opt.freshbefore && emit(opt.freshbefore, $this, opt, exportObj);
			switch (opt.type) {
				case 'number':
					_freshNumber();
					format = function (rawNumber) {
						return rawNumber.toFixed(opt.fixed);
					};
					break;
				case 'date':
					_freshDate();
					format = function (rawNumber) {
						let rawDate = new Date(rawNumber);
						return rawDate.format(opt.dateformat);
					};
					break;
			}
			let interval = setInterval(function () {
				let rawNumber = isIncrease ? Math.min(start, end) : Math.max(start, end);
				$this.text(format(rawNumber));
				if (isIncrease ? rawNumber >= end : rawNumber <= end) {
					clearInterval(interval);
				} else {
					start = rawNumber + step;
				}
			}, duration);
			opt.freshafter && emit(opt.freshafter, $this, opt, exportObj);
		});
		_fresh();
	},
	setOptionsBefore: null,
	setOptionsAfter: null,
	initBefore: null,
	initAfter: function ($this, opt, exportObj) {
		if (!opt.once) {
			$(document).addEventListener('dom.load.transition', function () {
				if ($this.dataset.to != opt.to) {
					opt.to = $this.dataset.to;
					exportObj.fresh();
				}
			});
		}
	},
	destroyBefore: null,
};
