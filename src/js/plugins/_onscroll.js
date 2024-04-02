import { emit, off, on } from '../core/event.js';
export default {
	name: 'onscroll',
	defaultOpt: {
		callback: null,
		params: null,
		reserve: 0,
		once: true,
	},
	init: function ($this, opt, exportObj) {
		let eventName = 'dom.scroll.' + $.guid++;
		let _checkScreen = function (force) {
			let state = $.cui_state;
			if (opt.callback) {
				let scrolltop = state.scrollTop;
				let wheight = state.height;
				let offsetTop = $this.offset().top;
				if (
					offsetTop >= scrolltop &&
					offsetTop <= scrolltop + wheight + (force === true ? 0 : opt.reserve)
				) {
					emit(opt.callback, $this, opt, exportObj);
					if (opt.once) {
						opt.callback = null;
						off(eventName);
					}
				}
			}
		};
		on(eventName, function () {
			_checkScreen();
		});
		_checkScreen(true);
	},

	setOptionsBefore: null,
	setOptionsAfter: null,
	initBefore: null,
	initAfter: null,
	destroyBefore: null,
};
