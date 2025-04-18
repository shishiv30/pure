import { emit, off, on } from '../event.js';
import guid from '../../core/guid.js';
export default {
	name: 'view',
	defaultOpt: {
		horizontal: true,
		limitation: 0.1,
		onovertop: 'onovertop',
		onoverbottom: 'onoverbottom',
		onoverleft: 'onoverleft',
		onoverright: 'onoverright',
		onpushtop: 'onpushtop',
		onpushbottom: 'onpushbottom',
		onpushleft: 'onpushleft',
		onpushright: 'onpushright',
		onchange: 'onchange',
		oninitial: 'oninitial',
		scrollable: true,
		snapable: true,
		jumpback: true,
		vitualized: false,
		sensitive: 0.1,
	},
	init: function ($this, opt, exportObj) {
		var $wrapper = $this.children('div');
		opt.id = guid;
		var prePos = 0;
		var currPos = 0;
		var info = null;
		var isAnimating = false;
		var animateTime = 0.2;
		var _updateInfo = (exportObj.updateInfo = function () {
			var $slides = $wrapper.children();
			var outerHeight = $this.outerHeight();
			var outerWidth = $this.outerWidth();
			var max = opt.horizontal
				? $wrapper.outerWidth() - outerWidth
				: $wrapper.outerHeight() - outerHeight;
			max = Math.max(0, max);
			var limitation = (opt.horizontal ? outerWidth : outerHeight) * opt.limitation;
			var newIndex = null;
			var position = null;
			var offset = 0;
			if (opt.horizontal) {
				position = Math.round($wrapper.position().left);
			} else {
				position = Math.round($wrapper.position().top);
			}
			var sliderRange = [];
			$slides.forEach(function (item, index) {
				if (opt.horizontal) {
					offset += $item.outerWidth();
				} else {
					offset += $item.outerHeight();
				}

				if (newIndex === null && offset + position > 0) {
					newIndex = index;
				}
				sliderRange.push(offset);
			});
			info = {
				max: max,
				sliderRange: sliderRange,
				cWidth: outerWidth,
				cHeight: outerHeight,
				maxLimit: limitation,
				minLimit: limitation * -1 - max,
				scroll: opt.horizontal ? [prePos * -1, 0] : [0, prePos * -1],
				index: newIndex,
				length: $slides.length,
			};
		});
		var dfd;
		var _scroll = (exportObj.scroll = function (distance, animation) {
			dfd = $.Deferred();
			if (isAnimating) {
				dfd.reject();
				return dfd;
			}
			var offset = Math.round(distance);
			var animateFrame = opt.horizontal
				? {
						transform: 'translateX(' + offset + 'px)',
				  }
				: {
						transform: 'translateY(' + offset + 'px)',
				  };
			if (animation) {
				isAnimating = true;
				$wrapper.classList.add('animating');
				$wrapper.css(animateFrame);
				setTimeout(function () {
					isAnimating = false;
					$wrapper.classList.remove('animating');
					dfd && dfd.resolve();
				}, 210);
			} else {
				$wrapper.css(animateFrame);
				dfd.resolve();
			}
			return dfd;
		});
		var _go = (exportObj.go = function (index) {
			var newPos = index === 0 ? 0 : info.sliderRange[index - 1];
			var direction;
			var distance = currPos + newPos;
			if (opt.horizontal) {
				direction = distance > 0 ? 'left' : 'right';
			} else {
				direction = distance < 0 ? 'up' : 'down';
			}
			_moved(direction, newPos * -1, 0);
		});
		var _next = (exportObj.next = function () {
			if (info.index < info.length - 1) {
				_go(info.index + 1);
			}
		});
		var _prev = (exportObj.prev = function () {
			if (info.index > 0) {
				_go(info.index - 1);
			}
		});
		var _onMoving = function (moved) {
			var eventName = '';
			if (currPos > 0) {
				if (moved) {
					eventName = opt.horizontal ? opt.onpushleft : opt.onpushtop;
				} else {
					eventName = opt.horizontal ? opt.onoverleft : opt.onovertop;
				}
				eventName && emit(eventName, $this, opt, exportObj, currPos, prePos, info);
				return true;
			} else if (Math.abs(currPos) > info.max) {
				if (moved) {
					eventName = opt.horizontal ? opt.onpushright : opt.onpushbottom;
				} else {
					eventName = opt.horizontal ? opt.onoverright : opt.onoverbottom;
				}
				eventName && emit(eventName, $this, opt, exportObj, currPos, prePos, info);
				return true;
			}
			return false;
		};
		var _scrollWithInertia = function (distance, time) {
			var speed = distance / (time / 1000);
			var inertia = speed * animateTime;
			if (Math.abs(inertia) > 50) {
				currPos -= inertia;
			}
		};
		var _limitation = function (direction) {
			if ('left' === direction || 'up' === direction) {
				currPos = Math.min(currPos, info.maxLimit);
			} else {
				currPos = Math.max(currPos, info.minLimit);
			}
		};
		var _moving = function (direction, distance, isRelativeValue) {
			$wrapper.classList.add('dragging');
			if (isRelativeValue) {
				currPos = currPos - distance;
			} else {
				currPos = prePos - distance;
			}
			_limitation(direction);
			_scroll(currPos, false).then(
				$.throttle(function () {
					_onMoving(false);
				}, 200),
			);
		};
		var _moved = function (direction, distance, animateTime) {
			$wrapper.classList.remove('dragging');
			var itemSize;
			var end;
			var start;
			var isNext;

			if (opt.horizontal) {
				isNext = direction !== 'left';
			} else {
				isNext = direction !== 'up';
			}
			for (var i = 0; i < info.sliderRange.length; i++) {
				end = info.sliderRange[i];
				if (end + currPos >= 0) {
					start = info.sliderRange[i - 1] || 0;
					itemSize = end - start;
					break;
				}
			}

			if (animateTime) {
				if (opt.snapable) {
					// _scrollWithInertia(distance, animateTime);
					//if too move too slow revert and move less than one third, else snap to next slider
					var isSlow = Math.abs(distance) / animateTime < opt.sensitive;
					var isSlight = Math.abs(distance) < itemSize / 3;
					var isRevert = isSlow && isSlight;
					if (isRevert) {
						currPos = prePos;
					} else {
						currPos = isNext ? end * -1 : start * -1;
					}
				}
			} else {
				currPos = distance;
			}
			_limitation(direction);
			if (_onMoving(true)) {
				if (opt.jumpback) {
					if (currPos >= 0 || info.max <= 0) {
						currPos = 0;
					} else if (info.max + currPos <= 0) {
						currPos = info.max * -1;
					}
				}
			}
			_scroll(currPos, true)
				.then(function () {
					opt.onchange &&
						emit(opt.onchange, $this, opt, exportObj, currPos, prePos, info);
					prePos = currPos;
				})
				.always(function () {
					_updateInfo();
					emit('dom.scroll');
				});
		};
		var disable = (exportObj.disable = function () {
			$this.classList.remove('view-scroll');
			$this.classList.add('original-scroll');
			$this.off('mousewheel');
			$this.off('drag');
			$this.off('dragging');
			$this.off('dragged');
		});

		var enable = (exportObj.enable = function () {
			$this.classList.add('view-scroll');
			$this.classList.remove('original-scroll');

			$this.addEventListener('mousewheel', function (event) {
				var delta;
				if (opt.horizontal && event.deltaX) {
					delta = event.deltaX * -1;
				} else if (!opt.horizontal && event.deltaY) {
					delta = event.deltaY;
				} else {
					return;
				}
				event.preventDefault();

				$.throttle(function () {
					if (!isAnimating) {
						if (!opt.snapable) {
							var newPos = currPos + delta * 120;
							var direction;
							if (opt.horizontal) {
								direction = newPos > 0 ? 'left' : 'right';
							} else {
								direction = newPos < 0 ? 'up' : 'down';
							}
							_moved(direction, newPos, 0);
						} else if (delta < 0) {
							_next();
						} else {
							_prev();
						}
					}
				}, 50)();
				return false;
			});
			$this.addEventListener('drag', function () {
				_updateInfo();
			});
			$this.addEventListener('dragging', function (e, dir, dist) {
				var distance = opt.horizontal ? dist[0] : dist[1];
				var direction = opt.horizontal ? dir[0] : dir[1];
				_moving(direction, distance, false);
			});
			$this.addEventListener('dragged', function (e, dir, dist, time) {
				var distance = opt.horizontal ? dist[0] : dist[1];
				var direction = opt.horizontal ? dir[0] : dir[1];
				_moved(direction, distance, time);
			});
			on('dom.resize.view' + opt.id, _updateInfo);
			_updateInfo();
		});
		if ($.isTouch) {
			disable();
		} else {
			enable();
		}
		opt.oninitial && emit(opt.oninitial, $this, opt, exportObj, [info]);
	},
	setOptionsBefore: null,
	setOptionsAfter: null,
	initBefore: null,
	initAfter: null,
	destroyBefore: function ($this, opt) {
		off('dom.resize.view' + opt.id);
	},
};
