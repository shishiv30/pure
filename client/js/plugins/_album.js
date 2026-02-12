import { trigger, emit, on, off } from '../core/event.js';
import { stringToObj } from '../convert.js';
const ImgStatus = {
	INIT: 0,
	LOADING: 1,
	LOADED: 2,
};
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
const classStatus = {
	current: 'current',
	prev: 'prev',
	next: 'next',
	preload: 'preload',
};
const emptyImg = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACAkQBADs=';
let updateImage = function (img, className, src, alt, index, length) {
	if (img) {
		if (img.className !== className) {
			img.className = className;
		}
		if (!src) {
			src = emptyImg;
		} else if (img.src !== src) {
			img.src = src;
		}
		if (alt) {
			if (index !== undefined && length != undefined) {
				img.alt = `${alt} (${index + 1} of ${length})`;
			} else {
				img.alt = alt;
			}
		}
	}
};

export default {
	name: 'album',
	defaultOpt: {
		images: [],
		imagesMeta: [],
		autoPlay: false,
		showProcess: true,
		showControl: true,
		direction: true,
		preload: true,
		duration: 0.2,
		throttle: 50,
		alt: '',
	},
	async init($el, opt, exportOb) {
		if (opt.imagesUrl) {
			//fetch images from url
			try {
				const response = await fetch(opt.imagesUrl);
				let data = await response.json();
				if (data.images && data.imagesMeta) {
					opt.images = data.images;
					opt.imagesMeta = data.imagesMeta;
				} else if (data.images) {
					opt.images = data.images;
				}
			} catch (error) {
				console.error('Error fetching images:', error);
				return;
			}
		}
		if (!opt.images) {
			return;
		}

		opt.images = stringToObj(opt.images);
		if (opt.imagesMeta && opt.imagesMeta.length > 0) {
			opt.imagesMeta = stringToObj(opt.imagesMeta);
		}
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
		let currentImg = $el.querySelector('img');
		if (currentImg) {
			opt.imgIndex = opt.images.findIndex((img) => currentImg.src.indexOf(img) > -1);
			if (currentImg.alt && !opt.alt) {
				opt.alt = currentImg.alt;
			}
			if (opt.imgIndex < 0) {
				opt.imgIndex = 0;
				console.warn('initial image not found in album');
			}
			updateImage(
				currentImg,
				classStatus.current,
				opt.images[opt.imgIndex],
				opt.alt,
				opt.imgIndex,
				length,
			);
		} else {
			opt.imgIndex = 0;
			currentImg = document.createElement('img');
			updateImage(
				currentImg,
				classStatus.current,
				opt.images[opt.imgIndex],
				opt.alt,
				opt.imgIndex,
				length,
			);
			currentImg.attributes['loading'] = 'lazy';
			$list.appendChild(currentImg);
		}

		let prevImg = document.createElement('img');
		opt.prevIndex = _getPrevIndex(opt.imgIndex, length);
		updateImage(
			prevImg,
			classStatus.prev,
			opt.preload ? opt.images[opt.prevIndex] : null,
			opt.alt,
			opt.prevIndex,
			length,
		);
		$list.appendChild(prevImg);

		let nextImg = document.createElement('img');
		opt.nextIndex = _getNextIndex(opt.imgIndex, length);
		updateImage(
			nextImg,
			classStatus.next,
			opt.preload ? opt.images[opt.nextIndex] : null,
			opt.alt,
			opt.nextIndex,
			length,
		);
		$list.appendChild(nextImg);

		let preloadImg;
		if (length > 3) {
			preloadImg = document.createElement('img');
			updateImage(preloadImg, classStatus.preload, null, opt.alt);
			$list.appendChild(preloadImg);
		}

		//if touch event
		let width;
		let timer;
		let touchStart;
		let touchStartY;
		let deltaX = 0;
		function reset() {
			if ($list.style.transition) {
				$list.style.transition = 'none';
			}
			if (deltaX > opt.throttle) {
				prev();
			} else if (deltaX < 0 && deltaX < opt.throttle * -1) {
				next();
			} else if (opt.preload) {
				//reset to initial image
				let prevImg = $list.querySelector(`img.${classStatus.prev}`);
				prevImg.src = opt.images[opt.prevIndex];
				let nextImg = $list.querySelector(`img.${classStatus.next}`);
				nextImg.src = opt.images[opt.nextIndex];
				opt.preload = true;
			}
			$list.style.transform = `translateX(${width * -1}px)`;
			deltaX = 0;
			updateProcess();
		}
		function updateProcess() {
			if (opt.showProcess) {
				let active = $el.querySelector('.album-processing > .active');
				if (active) {
					active.classList.remove('active');
				}
				let current = $el.querySelector(`.album-processing > button[data-index="${opt.imgIndex}"]`);
				if (current) {
					current.classList.add('active');
				}
				if (current) {
					let process = $el.querySelector('.album-processing');
					let offset = current.offsetLeft - process.clientWidth / 2 + current.clientWidth / 2;
					process.scrollTo({
						left: offset,
						behavior: 'smooth',
					});
				}
			}
		}
		function updateAlbumInfo() {
			if (!opt.imagesMeta || opt.imagesMeta.length === 0) {
				return;
			}
			let albumInfo = $el.querySelector('.album-info');
			let albumInfoContent = albumInfo?.querySelector('.album-info-content');

			// Create structure if it doesn't exist
			if (!albumInfo) {
				albumInfo = document.createElement('div');
				albumInfo.className = 'album-info';
				albumInfoContent = document.createElement('div');
				albumInfoContent.className = 'album-info-content';

				const labelEl = document.createElement('span');
				labelEl.className = 'album-info-label';
				const titleEl = document.createElement('b');
				titleEl.className = 'album-info-title';
				const descEl = document.createElement('p');
				descEl.className = 'album-info-description';

				albumInfoContent.appendChild(labelEl);
				albumInfoContent.appendChild(titleEl);
				albumInfoContent.appendChild(descEl);
				albumInfo.appendChild(albumInfoContent);
				$el.appendChild(albumInfo);
			}

			// Update content
			const currentIndex = opt.imgIndex;
			if (currentIndex >= 0 && currentIndex < opt.imagesMeta.length) {
				const meta = opt.imagesMeta[currentIndex];
				const labelEl = albumInfoContent.querySelector('.album-info-label');
				const titleEl = albumInfoContent.querySelector('.album-info-title');
				const descEl = albumInfoContent.querySelector('.album-info-description');

				if (labelEl) {
					labelEl.textContent = meta.index + ' / ' + opt.imagesMeta.length;
				}
				if (titleEl) {
					titleEl.textContent = meta.title;
				}
				if (descEl) {
					descEl.textContent = meta.description;
				}
			}
		}
		function next() {
			//update image
			opt.prevIndex = opt.imgIndex;
			opt.imgIndex = opt.nextIndex;
			opt.nextIndex = _getNextIndex(opt.nextIndex, length);
			let currentImg = $list.querySelector(`img.${classStatus.current}`);
			let prevImg = $list.querySelector(`img.${classStatus.prev}`);
			let nextImg = $list.querySelector(`img.${classStatus.next}`);
			nextImg.className = classStatus.current;
			currentImg.className = classStatus.prev;
			if (preloadImg) {
				opt.preloadIndex = _getNextIndex(opt.nextIndex, length);
				updateImage(
					preloadImg,
					classStatus.preload,
					opt.images[opt.preloadIndex],
					opt.alt,
					opt.preloadIndex,
					length,
				);
			}
			updateImage(
				prevImg,
				classStatus.next,
				opt.images[opt.nextIndex],
				opt.alt,
				opt.nextIndex,
				length,
			);
			updateAlbumInfo();
		}

		function prev() {
			//update image
			opt.nextIndex = opt.imgIndex;
			opt.imgIndex = opt.prevIndex;
			opt.prevIndex = _getPrevIndex(opt.prevIndex, length);
			let currentImg = $list.querySelector(`img.${classStatus.current}`);
			let prevImg = $list.querySelector(`img.${classStatus.prev}`);
			let nextImg = $list.querySelector(`img.${classStatus.next}`);
			prevImg.className = classStatus.current;
			currentImg.className = classStatus.next;
			if (preloadImg) {
				opt.preloadIndex = _getPrevIndex(opt.prevIndex, length);
				updateImage(
					preloadImg,
					classStatus.preload,
					opt.images[opt.preloadIndex],
					opt.alt,
					opt.preloadIndex,
					length,
				);
			}
			updateImage(
				nextImg,
				classStatus.prev,
				opt.images[opt.prevIndex],
				opt.alt,
				opt.prevIndex,
				length,
			);
			updateAlbumInfo();
		}
		//how to check if the device has mouse or touch pad
		let isOnlyTouchScreen =
			window.ontouchstart !== undefined && window.matchMedia('(hover: hover)').matches === false;
		let onStart = isOnlyTouchScreen
			? (e) => {
				let touch = e.touches[0];
				clearTimeout(timer);
				width = $list.clientWidth;
				touchStart = touch.clientX;
				touchStartY = touch.clientY;
				if (e.touches.length > 1) {
					return;
				}
				reset();
			}
			: (e) => {
				clearTimeout(timer);
				width = $list.clientWidth;
				reset();
				touchStart = e.clientX;
				touchStartY = e.clientY;
			};
		let onMove = isOnlyTouchScreen
			? (e) => {
				if ($list.style.transition) {
					$list.style.transition = 'none';
				}

				cancelAnimationFrame(timer);
				timer = requestAnimationFrame(() => {
					let touch = e.touches[0];
					deltaX = touch.clientX - touchStart;
					//base on deltaX, to get a percentage of the animation
					let percentage = (deltaX / width) * 100;
					$list.style.transform = `translateX(${width * -1 + deltaX}px)`;
				});
			}
			: (e) => {
				if (!touchStart) {
					return;
				}
				if ($list.style.transition) {
					$list.style.transition = 'none';
				}

				cancelAnimationFrame(timer);
				timer = requestAnimationFrame(() => {
					deltaX = e.clientX - touchStart;
					$list.style.transform = `translateX(${width * -1 + deltaX}px)`;
				});
			};
		let onEnd = isOnlyTouchScreen
			? (e) => {
				if (!touchStart) {
					return;
				}
				touchStart = null;
				if (e.touches.length > 0) {
					return;
				}
				cancelAnimationFrame(timer);
				width = $list.clientWidth;
				$list.style.transition = `transform ${opt.duration}s`;

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
			}
			: (e) => {
				if (!touchStart) {
					return;
				}
				touchStart = null;
				cancelAnimationFrame(timer);
				width = $list.clientWidth;
				$list.style.transition = `transform ${opt.duration}s`;

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
			};
		if (isOnlyTouchScreen) {
			$list.addEventListener('touchstart', (e) => {
				onStart(e);
			});
			$list.addEventListener('touchmove', (e) => {
				// Only trigger on horizontal move
				if (e.touches.length === 1 && touchStart && touchStartY) {
					const dx = Math.abs(e.touches[0].clientX - touchStart);
					const dy = Math.abs(e.touches[0].clientY - touchStartY);
					//after I get horizontal move and vertical move, I need to check if user want to scroll
					if (dx > dy && dy < 150) {
						e.preventDefault();
						onMove(e);
					} else {
						//check why need to reset touchStart and touchStartY
						touchStart = null;
						touchStartY = null;
					}
				}
			});
			$list.addEventListener('touchend', (e) => {
				e.preventDefault();
				onEnd(e);
			});
			$list.addEventListener('touchcancel', (e) => {
				e.preventDefault();
				onEnd(e);
			});
		} else {
			$list.addEventListener('mousedown', (e) => {
				e.preventDefault();
				onStart(e);
			});
			$list.addEventListener('mousemove', (e) => {
				e.preventDefault();
				onMove(e);
			});
			$list.addEventListener('mouseup', (e) => {
				e.preventDefault();
				onEnd(e);
			});
			$list.addEventListener('mouseleave', (e) => {
				e.preventDefault();
				onEnd(e);
			});
		}

		if (opt.showProcess) {
			let process = document.createElement('div');
			process.className = 'album-processing';
			for (let i = 0; i < length; i++) {
				let button = document.createElement('button');
				button.setAttribute('aria-label', `Go to ${i + 1}`);
				button.setAttribute('data-index', i);
				button.addEventListener('click', function () {
					if (i === opt.imgIndex) {
						return;
					}
					opt.imgIndex = i;
					opt.prevIndex = _getPrevIndex(i, length);
					opt.nextIndex = _getNextIndex(i, length);
					updateImage(currentImg, classStatus.current, opt.images[i], opt.alt, i, length);
					updateImage(
						prevImg,
						classStatus.prev,
						opt.images[opt.prevIndex],
						opt.alt,
						opt.prevIndex,
						length,
					);
					updateImage(
						nextImg,
						classStatus.next,
						opt.images[opt.nextIndex],
						opt.alt,
						opt.nextIndex,
						length,
					);
					updateProcess();
					updateAlbumInfo();
				});
				process.appendChild(button);
			}
			$el.appendChild(process);
			updateProcess();
		}

		exportOb.next = next;
		exportOb.prev = prev;
		updateAlbumInfo();
		return exportOb;
	},
};
