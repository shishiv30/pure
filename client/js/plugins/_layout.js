function clearRing(main) {
	const stage = main.querySelector(':scope > .layout-ring-stage');
	if (stage) {
		while (stage.firstChild) {
			main.insertBefore(stage.firstChild, stage);
		}
		stage.remove();
	}
	main.classList.remove('layout-ring');
	main.style.removeProperty('--ring-perspective');
}

function mountRing(main) {
	clearRing(main);
	const articles = [...main.querySelectorAll(':scope > .article')];
	if (articles.length <= 20) {
		return;
	}
	const stage = document.createElement('div');
	stage.className = 'layout-ring-stage';
	articles.forEach((article) => stage.appendChild(article));
	main.prepend(stage);
	const count = articles.length;
	const step = 360 / count;
	const cardWidth = 300;
	const gap = 24;
	const radius = Math.round(((cardWidth + gap) / 2) / Math.tan(Math.PI / count));
	stage.style.setProperty('--ring-radius', radius + 'px');
	main.style.setProperty('--ring-perspective', radius + 'px');
	articles.forEach((article, index) => {
		article.style.setProperty('--ring-angle', index * step + 'deg');
	});
	main.classList.add('layout-ring');
	bindRingDrag(stage, radius, articles, step);
}

function bindRingDrag(stage, radius, articles, step) {
	let spin = 0;
	let pointerId = null;
	let lastX = 0;
	let startX = 0;
	let startY = 0;
	let dragging = false;
	let frame = 0;
	const radians = 180 / Math.PI;

	function wrap(deg) {
		return ((deg % 360) + 360) % 360;
	}

	function updateFacing() {
		if (!Number.isFinite(spin)) {
			spin = 0;
		}
		articles.forEach((article, index) => {
			const position = wrap(index * step + spin);
			const fromFront = Math.abs(position - 180);
			const delta = Math.min(fromFront, 360 - fromFront);
			article.style.pointerEvents = delta < 90 ? 'auto' : 'none';
		});
	}

	function paint() {
		frame = 0;
		stage.style.setProperty('--ring-spin', spin + 'deg');
		updateFacing();
	}

	updateFacing();

	stage.addEventListener('pointerdown', (event) => {
		pointerId = event.pointerId;
		lastX = event.clientX;
		startX = event.clientX;
		startY = event.clientY;
		dragging = false;
	});
	stage.addEventListener('pointermove', (event) => {
		if (event.pointerId !== pointerId) {
			return;
		}
		const dx = event.clientX - startX;
		const dy = event.clientY - startY;
		if (!dragging) {
			if (Math.hypot(dx, dy) < 8) {
				return;
			}
			if (Math.abs(dy) > Math.abs(dx)) {
				pointerId = null;
				return;
			}
			dragging = true;
			lastX = event.clientX;
			stage.setPointerCapture(event.pointerId);
			stage.classList.add('is-grabbing');
		}
		spin -= ((event.clientX - lastX) / radius) * radians;
		lastX = event.clientX;
		if (!frame) {
			frame = requestAnimationFrame(paint);
		}
	});
	function resetPointer(reason, event) {
		if (event && event.pointerId !== undefined && pointerId !== null && event.pointerId !== pointerId) {
			return;
		}
		const id = pointerId;
		pointerId = null;
		dragging = false;
		stage.classList.remove('is-grabbing');
		if (reason !== 'lostpointercapture' && id !== null && stage.hasPointerCapture(id)) {
			stage.releasePointerCapture(id);
		}
		if (!Number.isFinite(spin)) {
			spin = 0;
			paint();
		}
	}
	stage.addEventListener('pointerup', (event) => resetPointer(event.type, event));
	stage.addEventListener('pointercancel', (event) => resetPointer(event.type, event));
	stage.addEventListener('lostpointercapture', (event) => resetPointer(event.type, event));
	window.addEventListener('blur', () => resetPointer('blur', null));
	stage.addEventListener('wheel', (event) => {
		if (Math.abs(event.deltaY) >= Math.abs(event.deltaX)) {
			return;
		}
		event.preventDefault();
		spin -= (event.deltaX / radius) * radians;
		if (!frame) {
			frame = requestAnimationFrame(paint);
		}
	}, { passive: false });
}

function playLayoutMove(main, apply) {
	const articles = [...main.querySelectorAll('.article')];
	const from = articles.map((article) => article.getBoundingClientRect());
	articles.forEach((article) => {
		article.style.transition = 'none';
		article.style.transform = '';
	});
	apply();
	const destinations = articles.map((article) => {
		const value = getComputedStyle(article).transform;
		return value === 'none' ? '' : value;
	});
	articles.forEach((article, index) => {
		const next = article.getBoundingClientRect();
		const prev = from[index];
		const dx = (prev.left + prev.width / 2) - (next.left + next.width / 2);
		const dy = (prev.top + prev.height / 2) - (next.top + next.height / 2);
		article.style.transition = 'none';
		article.style.transform = `translate(${dx}px, ${dy}px) ${destinations[index]}`;
	});
	main.offsetWidth;
	requestAnimationFrame(() => {
		articles.forEach((article, index) => {
			article.style.transition = 'transform .6s ease';
			article.style.transform = destinations[index];
			const done = (event) => {
				if (event.propertyName !== 'transform') {
					return;
				}
				article.style.transition = '';
				article.style.transform = '';
				article.removeEventListener('transitionend', done);
			};
			article.addEventListener('transitionend', done);
		});
	});
}

export default {
	name: 'layout',
	defaultOpt: {},
	init: function ($el, opt, exportObj) {
		exportObj.model = $el.classList.contains('layout-horizontal') ? 'horizontal' : 'default';
		if (exportObj.model === 'horizontal') {
			mountRing($el);
		}
		exportObj.setModel = function (model) {
			const next = model === 'horizontal' ? 'horizontal' : 'default';
			if (next === exportObj.model) {
				return;
			}
			if (next === 'horizontal') {
				window.scrollTo(0, 0);
			}
			playLayoutMove($el, () => {
				$el.classList.remove('layout-horizontal');
				clearRing($el);
				if (next === 'horizontal') {
					$el.classList.add('layout-horizontal');
					mountRing($el);
				}
				exportObj.model = next;
			});
		};
	},
	initBefore: null,
};
