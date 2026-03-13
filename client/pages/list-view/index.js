import { main } from '../../js/index.js';
import scss from '../../scss/index.scss';

export default (function (win) {
	main(win);

	const body = document.getElementById('body');
	if (!body || !body.classList.contains('page-list-view')) {
		return;
	}

	const EDGE = 30;

	const onMove = (e) => {
		const y = e.clientY;
		const h = win.innerHeight || document.documentElement.clientHeight || 0;
		const isTop = y <= EDGE;
		const isBottom = y >= h - EDGE;

		if (isTop) {
			body.classList.add('list-view-hover-top');
		} else {
			body.classList.remove('list-view-hover-top');
		}

		if (isBottom) {
			body.classList.add('list-view-hover-bottom');
		} else {
			body.classList.remove('list-view-hover-bottom');
		}
	};

	win.addEventListener('mousemove', onMove);
})(window);

