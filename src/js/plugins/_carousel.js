import { emit, off, on } from '../core/event.js';

function loadImg(img) {
	let $img = $(img);
	let imgSrc = $img.dataset.src;
	if (imgSrc) {
		$.loadImg($img, imgSrc);
	}
	$img.remov.dataset.src;
}

function _updateWidth($this, $scroller, opt) {
	let width = $this.width();
	let count = 1;
	for (let i = opt.length; i > 0; i--) {
		if (width > i * opt.size) {
			count = i + 1;
			break;
		}
	}
	count = Math.min(count, opt.length);
	$this[0].style.setProperty('--carousel-height', (width * opt.ratio) / count + 'px');
	_checkArraow($this, $scroller);
	$scroller.attr('count', count);
	opt.width = width;
	opt.count = count;
}
function _checkArraow($this, $scroller) {
	if ($.isTouch) {
		return;
	}
	let scrollLeft = $scroller.scrollLeft();
	let innerWidth = $scroller.innerWidth();
	let scrollWidth = $scroller.prop('scrollWidth');
	if (scrollLeft + innerWidth >= scrollWidth - 100) {
		$this.classList.remove('hasNext');
	} else {
		$this.classList.add('hasNext');
	}
	if (scrollLeft <= 100) {
		$this.classList.remove('hasPrev');
	} else {
		$this.classList.add('hasPrev');
	}
}
function _getOffset($el, next) {
	let offset = 0;
	$el.each(function (item, index) {
		let $this = $item;
		let left = $this.offset().left;
		if (next) {
			if (left >= 0) {
				offset = $this.outerWidth(true);
				return false;
			}
		} else {
			let width = $this.outerWidth(true);
			if (left + width >= 0) {
				offset = width;
				return false;
			}
		}
	});
	return offset;
}

export default {
	name: 'carousel',
	defaultOpt: {
		size: 320,
		length: 5,
		ratio: 0.6,
	},
	init: function ($this, opt, exportObj) {
		let $scroller = $this.querySelectorAll('[data-role*="scrollbar"]');
		exportObj.$scroller = $scroller;
		opt._id = $.guid++;
		if (opt.size !== 'auto') {
			_updateWidth($this, $scroller, opt);
		} else {
			_checkArraow($this, $scroller);
		}
		exportObj.next = function () {
			let width = opt.width;
			let count = opt.count;
			if (!$this.classList.contains('hasNext')) {
				return;
			}
			let offset;
			if (count) {
				offset = count - 1 ? (width * (count - 1)) / count : width;
			} else {
				offset = _getOffset($scroller.children(), true);
			}
			let left = $scroller.scrollLeft();
			$scroller.stop().animate(
				{
					scrollLeft: left + offset,
				},
				150,
			);
		};
		exportObj.prev = function () {
			let width = opt.width;
			let count = opt.count;
			if (!$this.classList.contains('hasPrev')) {
				return;
			}
			let offset;
			if (count) {
				offset = count - 1 ? (width * (count - 1)) / count : width;
			} else {
				offset = this.getOffset($scroller.children(), false);
			}
			let left = $scroller.scrollLeft();
			$scroller.stop().animate(
				{
					scrollLeft: left - offset,
				},
				150,
			);
		};
	},
	setOptionBefore: null,
	setOptionsAfter: null,
	initBefore: null,
	initAfter: function ($this, opt, exportObj) {
		let $scroller = exportObj.$scroller;
		if (!$.isTouch) {
			let $prevLink = $(
				'<button type="button" class="arrow prev"><i class="icon-angle-left"></i></button>',
			);
			let $nextLink = $(
				'<button type="button" class="arrow next"><i class="icon-angle-right"></i></button>',
			);

			$prevLink.addEventListener('click', exportObj.prev);
			$nextLink.addEventListener('click', exportObj.next);
			$this.append($prevLink);
			$this.append($nextLink);
		}

		on('dom.resize.carousel' + opt._id, function () {
			if (opt.size !== 'auto') {
				_updateWidth($this, $scroller, opt);
			} else {
				_checkArraow($this, $scroller);
			}
		});
		$scroller.on(
			'scroll',
			$.throttle(function () {
				_checkArraow($this, $scroller);
			}, 500),
		);
	},
	destroyBefore: function ($this, opt) {
		off('dom.resize.carousel' + opt._id);
	},
};
