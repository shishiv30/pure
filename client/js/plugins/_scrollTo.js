import { emit, trigger } from '../core/event.js';

/**
 * Resolve the scroll target element from options or link href.
 * @param {Element} $el - Trigger element (e.g. link or button).
 * @param {{ target?: string | null }} opt - Plugin options.
 * @returns {Element | null} Target element or null.
 */
function getTargetElement($el, opt) {
	const selector = opt.target || $el.getAttribute('href');
	if (!selector || typeof selector !== 'string') {
		return null;
	}
	// Support #id or CSS selector
	if (selector.startsWith('#')) {
		const id = selector.slice(1);
		return document.getElementById(id) || document.querySelector(selector);
	}
	return document.querySelector(selector);
}

/**
 * Scroll so that the target element is in view.
 * @param {Element} targetEl - Element to scroll to.
 * @param {Element | null} container - Scroll container or null for window.
 * @param {number} offsetTop - Pixels from top of viewport/container.
 */
function scrollToElement(targetEl, container, offsetTop) {
	const offset = offsetTop || 0;
	if (container) {
		const containerRect = container.getBoundingClientRect();
		const targetRect = targetEl.getBoundingClientRect();
		const top =
			container.scrollTop + (targetRect.top - containerRect.top) - offset;
		container.scrollTo({ top, behavior: 'smooth' });
	} else {
		const top =
			window.scrollY + targetEl.getBoundingClientRect().top - offset;
		window.scrollTo({ top, behavior: 'smooth' });
	}
}

export default {
	name: 'scrollto',
	defaultOpt: {
		target: null,
		offsetTop: 0,
		container: null,
		beforeScroll: null,
		afterScroll: null,
	},
	init: function ($el, opt, exportObj) {
		const handleClick = function (e) {
			if (opt.beforeScroll) {
				trigger(opt.beforeScroll, $el, opt, exportObj);
			}
			const targetEl = getTargetElement($el, opt);
			if (targetEl) {
				const container = opt.container
					? document.querySelector(opt.container)
					: null;
				const offsetTop = Number(opt.offsetTop) || 0;
				scrollToElement(targetEl, container, offsetTop);
			}
			if (opt.afterScroll) {
				trigger(opt.afterScroll, $el, opt, exportObj);
			}
			e.preventDefault();
		};
		$el.addEventListener('click', handleClick);
		exportObj._clickHandler = handleClick;
	},
	initAfter: null,
	destroyBefore: function ($el, opt, exportObj) {
		if (exportObj._clickHandler) {
			$el.removeEventListener('click', exportObj._clickHandler);
			exportObj._clickHandler = null;
		}
	},
};
