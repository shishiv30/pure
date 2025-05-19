import { trigger, emit, on, off } from '../core/event.js';
import { stringToObj } from '../convert.js';
import { set } from 'lodash';

let _getNextIndex = function (index, length) {
	if (index === length - 1) {
		return 0;
	} else {
		return index + 1;
	}
};

let _getPrevIndex = function (index, length) {
	if (index === 0) {
		return length - 1;
	} else {
		return index - 1;
	}
};

export default {
	name: 'album',
	defaultOpt: {
		images: [],
		autoPlay: false,
		showProcess: true,
		showControl: true,
		direction: true,
		preload: true,
		duration: 0.2,
		throttle: 50,
	},
	init($el, opt, exportOb) {
		if (!opt.images) {
			return;
		}
		opt.images = stringToObj(opt.images);
		let length = opt.images.length;
		if (length <= 1) {
			return;
		}
		let $list = $el.querySelector('.album-list');
		if (!$list) {
			$list = document.createElement('div');
			$list.className = 'album-list';
			$el.appendChild($list);
		}
		let currentImg = $el.querySelector('img:first-of-type');

		if (currentImg) {
			opt.imgIndex = opt.images.indexOf(currentImg.src);
			if (opt.imgIndex < 0) {
				opt.imgIndex = 0;
				currentImg.src = opt.images[opt.imgIndex];
				currentImg.attributes['loading'] = 'lazy';
				console.warn('initial image not found in album');
			}
		} else {
			opt.imgIndex = 0;
			currentImg = document.createElement('img');
			currentImg.src = opt.images[opt.imgIndex];
			currentImg.alt = 'current img';
			currentImg.attributes['loading'] = 'lazy';
			$list.appendChild(currentImg);
		}

		let prevImg = document.createElement('img');
		opt.prevIndex = _getPrevIndex(opt.imgIndex, length);
		if (opt.preload) {
			prevImg.src = opt.images[opt.prevIndex];
		} else {
			prevImg.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACAkQBADs=';
		}
		prevImg.alt = 'prev img';
		$list.appendChild(prevImg);

		let nextImg = document.createElement('img');
		opt.nextIndex = _getNextIndex(opt.imgIndex, length);
		if (opt.preload) {
			nextImg.src = opt.images[opt.nextIndex];
		} else {
			nextImg.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACAkQBADs=';
		}
		nextImg.alt = 'next img';
		$list.appendChild(nextImg);

		let preloadImg;
		if (length > 3) {
			preloadImg = document.createElement('img');
			preloadImg.alt = `preload image`;
			preloadImg.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACAkQBADs=';
			preloadImg.attributes['loading'] = 'lazy';
			preloadImg.style.display = 'none';
			$list.appendChild(preloadImg);
		}

		//if touch event
		let width;
		let timer;
		let touchStart;
		let deltaX = 0;
		function reset() {
			$list.style.pointerEvents = 'auto';
			if ($list.style.transition) {
				$list.style.transition = 'none';
			}
			if (deltaX > opt.throttle) {
				prev();
			} else if (deltaX < 0 && deltaX < opt.throttle * -1) {
				next();
			} else if (opt.preload) {
				//reset to initial image
				prevImg.src = opt.images[opt.prevIndex];
				nextImg.src = opt.images[opt.nextIndex];
				opt.preload = true;
			} else {
				$list.style.transform = `translateX(${width * -1}px)`;
			}
			deltaX = 0;
		}
		function next() {
			//update image
			opt.prevIndex = opt.imgIndex;
			opt.imgIndex = opt.nextIndex;
			opt.nextIndex = _getNextIndex(opt.nextIndex, length);
			currentImg.src = opt.images[opt.imgIndex];
			prevImg.src = opt.images[opt.prevIndex];
			if (preloadImg) {
				opt.preloadIndex = _getNextIndex(opt.nextIndex, length);
				preloadImg.src = opt.images[opt.preloadIndex];
			}
			setTimeout(() => {
				$list.style.transform = `translateX(${width * -1}px)`;
				requestAnimationFrame(() => {
					nextImg.src = opt.images[opt.nextIndex];
				});
			}, 100);
		}
		function prev() {
			//update image
			opt.nextIndex = opt.imgIndex;
			opt.imgIndex = opt.prevIndex;
			opt.prevIndex = _getPrevIndex(opt.prevIndex, length);
			currentImg.src = opt.images[opt.imgIndex];
			nextImg.src = opt.images[opt.nextIndex];
			if (preloadImg) {
				opt.preloadIndex = _getPrevIndex(opt.prevIndex, length);
				preloadImg.src = opt.images[opt.preloadIndex];
			}
			setTimeout(() => {
				$list.style.transform = `translateX(${width * -1}px)`;
				requestAnimationFrame(() => {
					prevImg.src = opt.images[opt.prevIndex];
				});
			}, 100);
		}
		if (window.ontouchstart !== undefined) {
			$list.addEventListener('touchstart', function (e) {
				e.preventDefault();
				if (e.touches.length > 1) {
					return;
				}
				clearTimeout(timer);
				reset();
				width = $list.clientWidth;
				touchStart = e.touches[0].clientX;
			});
			$list.addEventListener('touchmove', function (e) {
				e.preventDefault();

				if ($list.style.transition) {
					$list.style.transition = 'none';
				}

				cancelAnimationFrame(timer);
				timer = requestAnimationFrame(() => {
					let touch = e.touches[0];
					deltaX = touch.clientX - touchStart;
					$list.style.transform = `translateX(${width * -1 + deltaX}px)`;
					translateX = touch.clientX - width;
				});
			});
			$list.addEventListener('touchend', function (e) {
				e.preventDefault();
				if (e.touches.length > 0) {
					return;
				}
				cancelAnimationFrame(timer);
				width = $list.clientWidth;
				$list.style.transition = `transform ${opt.duration}s`;
				$list.style.pointerEvents = 'none';

				if (deltaX > 0 && deltaX > opt.throttle) {
					//snap to left with animation next
					$list.style.transform = 'translateX(0px)';
				} else if (deltaX < 0 && deltaX < opt.throttle * -1) {
					//snap to right with animation prev
					$list.style.transform = `translateX(${width * -2}px)`;
				} else {
					$list.style.transform = `translateX(${width * -1}px)`;
				}
				timer = setTimeout(() => {
					reset();
				}, opt.duration * 1100);
			});
		}

		exportOb.next = next;
		exportOb.prev = prev;
		return exportOb;
	},
};
