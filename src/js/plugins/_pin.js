import { emit } from '../core/event.js';
export default {
	name: 'pin',
	defaultOpt: {
		top: 50,
		bottom: 0,
		target: '',
	},
	init: function ($this, opt, exportObj) {
		let $target = $(opt.target);
		$this.css('position', 'relative');
		$target.classList.add('pin');
		let offsetTop = 0;
		let offsetBottom = 0;
		let reposition = function () {
			offsetTop = $this.offset().top - opt.top;
			offsetBottom = offsetTop + $this.height() - $target.height() - opt.bottom;
		};
		let _pin = function () {
			$target.css({
				position: 'fixed',
				top: opt.top,
				bottom: 'auto',
			});
		};
		let _unpin = function (isTop) {
			if (isTop) {
				$target.css({
					position: 'absolute',
					top: 0,
					bottom: 'auto',
				});
			} else {
				$target.css({
					position: 'absolute',
					top: 'auto',
					bottom: 0,
				});
			}
		};
		let _setpin = function (scrollTop, isReposition) {
			if (isReposition) {
				reposition();
			}
			if (scrollTop < offsetTop) {
				_unpin(true);
			} else {
				if (scrollTop > offsetBottom) {
					_unpin(false);
				} else {
					_pin();
				}
			}
		};
		exportObj.pin = _pin;
		exportObj.unpin = _unpin;
		exportObj.setpin = _setpin;
		window.addEventListener(
			'scroll',
			function () {
				let scrollTop = $(window).scrollTop();
				_setpin(scrollTop, false);
			},
			true,
		);
		$(document).addEventListener('dom.resize', function () {
			_setpin($.cui.scrollTop, true);
		});
	},
	setOptionsBefore: null,
	setOptionsAfter: null,
	initBefore: null,
	initAfter: null,
	destroyBefore: null,
};
