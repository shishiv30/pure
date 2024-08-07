import { emit } from '../core/event.js';
let animationDuration = 200;

function generateTip($parent, opt) {
	let $container = $(opt.template);
	$container.classList.add(opt.theme);
	$container.classList.add(opt.placement);
	$container.querySelectorAll('.tooltip-inner').html(opt.content);
	$parent.append($container);
	$container.addEventListener('click', function (e) {
		e.stopPropagation();
	});
	return $container;
}

function updateTip($this, opt, exportObj) {
	if (!exportObj.$parent) {
		exportObj.$parent = opt.parent ? $(opt.parent) : $this;
	}
	let $parent = exportObj.$parent;
	if (!exportObj.$container) {
		exportObj.$container = generateTip($parent, opt);
	}
	if ($parent.css('position') === 'static') {
		$parent.css('position', 'relative');
	}
	let $container = exportObj.$container;
	$container.querySelectorAll('.tooltip-inner').html(opt.content);
}

export default {
	name: 'tooltip',
	defaultOpt: {
		theme: 'defalut',
		placement: 'top',
		trigger: 'hover',
		html: true,
		once: false,
		onload: null,
		beforeShow: null,
		afterShow: null,
		beforeHide: null,
		afterHide: null,
		_timer: null,
		parent: null,
		template:
			'<div class="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
	},
	init: function ($this, opt, exportObj) {
		exportObj.show = function () {
			updateTip($this, opt, exportObj);
			let $container = exportObj.$container;

			if (opt._timer) {
				clearTimeout(opt._timer);
			}
			opt.beforeShow && emit(opt.beforeShow, $this, opt, exportObj);
			let cWidth = $container.outerWidth();
			let cHeight = $container.outerHeight();
			let tWidth = $this.outerWidth();
			let tHeight = $this.outerHeight();
			let offset = $this.offset();
			let wWidth = $(window).width();
			let x = 0;
			let css = {};
			$container.show();
			setTimeout(function () {
				$container.classList.add('in');
			}, 10);
			switch (opt.placement) {
				case 'top':
				case 'bottom':
					$container.classList.remove(`${opt.placement}-left`, `${opt.placement}-right`);
					x = Math.abs(tWidth - cWidth) / 2;
					if (x > offset.left) {
						css = {
							left: 0,
							right: '',
						};
						$container.classList.add(`${opt.placement}-left`);
					} else if (offset.left + tWidth + x > wWidth) {
						css = {
							left: '',
							right: 0,
						};
						$container.classList.add(`${opt.placement}-right`);
					} else {
						css = {
							left: (tWidth - cWidth) / 2,
							right: '',
						};
						$container.classList.add(opt.placement);
					}
					$container.css(css);
					break;
				case 'left':
				case 'right':
					$container.classList.remove(opt.placement);
					if (opt.placement === 'left') {
						x = cWidth * -1;
					} else {
						x = tWidth;
					}
					css = {
						top: (tHeight - cHeight) / 2,
						left: x,
						right: '',
					};
					$container.css(css);
					$container.classList.add(opt.placement);
					break;
			}
			if (opt.afterShow) {
				opt.afterShow && emit(opt.afterShow, $this, opt, exportObj);
			}
		};
		exportObj.hide = function () {
			if (!exportObj.$container) return;
			updateTip($this, opt, exportObj);
			exportObj.$parent.css('position', '');
			opt.beforeHide && emit(opt.beforeHide, $this, opt, exportObj);
			exportObj.$container.classList.remove('in');
			opt._timer = setTimeout(function () {
				exportObj.$container.hide();
				opt.afterHide && emit(opt.afterHide, $this, opt, exportObj);
				if (opt.once) {
					exportObj.$container.remove();
					exportObj.$container = null;
				}
			}, animationDuration + 1);
		};
	},
	setOptionsBefore: null,
	setOptionsAfter: function ($this, opt, exportObj) { },
	initBefore: null,
	initAfter: function ($this, opt, exportObj) {
		switch (opt.trigger) {
			case 'click':
				$this.addEventListener('click.' + exportObj.name, function () {
					exportObj.show();
					one('click', exportObj.hide);
					return false;
				});
				break;
			case 'focus':
				$this.addEventListener('focusin.' + exportObj.name, exportObj.show);
				$this.addEventListener('focusout.' + exportObj.name, exportObj.hide);
				break;
			case 'hover':
				$this.addEventListener('mouseenter.' + exportObj.name, exportObj.show);
				$this.addEventListener('mouseleave.' + exportObj.name, exportObj.hide);
				break;
		}
		opt.onload && emit(opt.onload, $this, opt, exportObj);
	},
	destroyBefore: function ($this, opt, exportObj) {
		$this.off('click.' + exportObj.name);
		$this.off('focusin.' + exportObj.name);
		$this.off('focusout.' + exportObj.name);
		$this.off('mouseenter.' + exportObj.name);
		$this.off('mouseleave.' + exportObj.name);
		exportObj.$container.remove();
	},
};
