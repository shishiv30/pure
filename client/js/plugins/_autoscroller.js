export default {
	name: 'autoscroller',
	defaultOpt: {},
	setOptionsBefore: function () {},
	setOptionsAfter: null,
	initBefore: null,
	init: function ($el, opt, exportObj) {
		const $track = $el.querySelector('[data-role="track"]') || $el;
		const $list = $track.querySelector('.autoscroller-list');
		if (!$list) {
			return;
		}

		let minY = 0;
		let maxY = 0;
		let pos = 0;
		let direction = -1;
		let rafId = null;

		const measure = function () {
			const listHeight = $list.offsetHeight || 0;
			const viewportH =
				window.innerHeight || document.documentElement.clientHeight || 0;
			const half = viewportH * 0.5;

			const halfPx = half;
			minY = halfPx;
			maxY = -(Math.max(listHeight - halfPx, 0));

			if (pos < maxY) pos = maxY;
			if (pos > minY) pos = minY;

			$track.style.transform = `translateY(${pos}px)`;
		};

		const step = function () {
			const speed = 0.3; // px per frame at ~60fps
			pos += direction * speed;

			if (pos <= maxY) {
				pos = maxY;
				direction = 1;
			} else if (pos >= minY) {
				pos = minY;
				direction = -1;
			}

			$track.style.transform = `translateY(${pos}px)`;
			rafId = window.requestAnimationFrame(step);
		};

		measure();
		rafId = window.requestAnimationFrame(step);

		exportObj._rafId = rafId;
	},
	initAfter: null,
	destroyBefore: function ($el, opt, exportObj) {
		if (exportObj._rafId) {
			window.cancelAnimationFrame(exportObj._rafId);
		}
		const $track = $el.querySelector('[data-role="track"]');
		if ($track) {
			$track.style.transform = '';
		}
	},
	destroyAfter: null,
};