import { trigger } from '../core/event.js';

let animationDuration = 200;

// Helper functions for DOM manipulation
function getOffset(el, relativeTo) {
	const elRect = el.getBoundingClientRect();
	if (relativeTo) {
		const parentRect = relativeTo.getBoundingClientRect();
		return {
			top: elRect.top - parentRect.top,
			left: elRect.left - parentRect.left,
		};
	}
	return {
		top: elRect.top + window.pageYOffset,
		left: elRect.left + window.pageXOffset,
	};
}

function outerWidth(el) {
	return el.offsetWidth;
}

function outerHeight(el) {
	return el.offsetHeight;
}

function setStyles(el, styles) {
	for (const prop in styles) {
		if (styles[prop] === '') {
			el.style.removeProperty(prop);
		} else {
			el.style[prop] = styles[prop];
		}
	}
}

function getStyle(el, prop) {
	return window.getComputedStyle(el)[prop];
}

function generateTip($parent, opt) {
	const $container = document.createElement('div');
	$container.className = 'tooltip';
	$container.innerHTML = opt.template;
	$container.classList.add(opt.theme);
	$container.classList.add(opt.placement);
	// CSS handles display: block and opacity: 0 initially
	// Don't set inline styles that would override CSS
	const inner = $container.querySelector('.tooltip-inner');
	if (inner) {
		if (opt.html) {
			inner.innerHTML = opt.content;
		} else {
			inner.textContent = opt.content;
		}
	}
	$parent.appendChild($container);
	$container.addEventListener('click', function (e) {
		e.stopPropagation();
	});
	return $container;
}

function updateTip($this, opt, exportObj) {
	if (!exportObj.$parent) {
		exportObj.$parent = opt.parent ? document.querySelector(opt.parent) : $this;
	}
	const $parent = exportObj.$parent;
	if (!exportObj.$container) {
		exportObj.$container = generateTip($parent, opt);
	}
	if (getStyle($parent, 'position') === 'static') {
		$parent.style.position = 'relative';
	}
	const $container = exportObj.$container;
	const inner = $container.querySelector('.tooltip-inner');
	if (inner) {
		if (opt.html) {
			inner.innerHTML = opt.content;
		} else {
			inner.textContent = opt.content;
		}
	}
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
			'<div class="tooltip-arrow"></div><div class="tooltip-inner"></div>',
	},
	init: function ($this, opt, exportObj) {
		exportObj.show = function () {
			updateTip($this, opt, exportObj);
			const $container = exportObj.$container;
			const $parent = exportObj.$parent;

			if (opt._timer) {
				clearTimeout(opt._timer);
			}
			opt.beforeShow && trigger(opt.beforeShow, $this, opt, exportObj);

			// Ensure tooltip is visible for measurement (CSS handles display: block and opacity: 0)
			// Remove any inline styles that might override CSS
			$container.style.display = 'block';
			$container.style.opacity = '';
			$container.style.visibility = 'hidden'; // Hidden but still measurable

			// Ensure tooltip is in DOM and has correct classes before measuring
			$container.classList.remove('in');
			$container.classList.add(opt.theme);
			$container.classList.add(opt.placement);

			// Force a reflow to ensure CSS is applied and dimensions are calculated
			void $container.offsetHeight;

			const cWidth = outerWidth($container);
			const cHeight = outerHeight($container);
			const tWidth = outerWidth($this);
			const tHeight = outerHeight($this);
			const offset = getOffset($this, $parent);
			// Use window width for viewport calculations, not parent width
			const wWidth = window.innerWidth;
			// Get the trigger element's position relative to viewport for space calculation
			const triggerRect = $this.getBoundingClientRect();
			const triggerLeft = triggerRect.left;
			const triggerRight = triggerRect.right;

			let x = 0;
			let css = {};
			switch (opt.placement) {
				case 'top':
				case 'bottom':
					// Ensure base placement class is present
					$container.classList.add(opt.placement);
					// Remove modifier classes first
					$container.classList.remove(`${opt.placement}-left`, `${opt.placement}-right`);

					// Calculate the offset needed to center the tooltip relative to trigger
					// This is the distance from trigger's left edge to tooltip's left edge when centered
					x = Math.abs(tWidth - cWidth) / 2;

					// Check if there's enough space on the left side of the viewport
					// If x (the offset needed for centering) is greater than triggerLeft,
					// it means the tooltip would overflow on the left
					if (x > triggerLeft) {
						css = {
							left: '0',
							right: '',
						};
						$container.classList.add(`${opt.placement}-left`);
					}
					// Check if tooltip would overflow on the right side
					// triggerLeft + tWidth + x is where the tooltip's right edge would be when centered
					else if (triggerLeft + tWidth + x > wWidth) {
						css = {
							left: '',
							right: '0',
						};
						$container.classList.add(`${opt.placement}-right`);
					}
					// Center the tooltip - position relative to trigger element
					else {
						css = {
							left: `${(tWidth - cWidth) / 2}px`,
							right: '',
						};
					}
					setStyles($container, css);
					break;
				case 'left':
				case 'right':
					// Ensure base placement class is present
					$container.classList.add(opt.placement);

					// Calculate vertical center
					const verticalCenter = (tHeight - cHeight) / 2;

					if (opt.placement === 'left') {
						// Position to the left of the trigger element
						css = {
							top: `${verticalCenter}px`,
							left: `${-cWidth}px`,
							right: '',
						};
					} else {
						// Position to the right of the trigger element
						css = {
							top: `${verticalCenter}px`,
							left: `${tWidth}px`,
							right: '',
						};
					}
					setStyles($container, css);
					break;
			}

			// Make tooltip visible after positioning
			$container.style.visibility = '';
			setTimeout(function () {
				$container.classList.add('in');
			}, 10);

			if (opt.afterShow) {
				opt.afterShow && trigger(opt.afterShow, $this, opt, exportObj);
			}
		};
		exportObj.hide = function () {
			if (!exportObj.$container) return;
			updateTip($this, opt, exportObj);
			opt.beforeHide && trigger(opt.beforeHide, $this, opt, exportObj);
			exportObj.$container.classList.remove('in');
			opt._timer = setTimeout(function () {
				// Keep display: block, just hide with opacity (CSS handles this)
				// Only remove if once is true
				if (opt.once) {
					exportObj.$container.remove();
					exportObj.$container = null;
					exportObj.$parent.style.position = '';
				} else {
					// Reset parent position only if we're keeping the tooltip
					exportObj.$parent.style.position = '';
				}
				opt.afterHide && trigger(opt.afterHide, $this, opt, exportObj);
			}, animationDuration + 1);
		};
	},
	setOptionsBefore: function ($this, opt, exportObj) {
		// Ensure content is read from data-content attribute
		if (opt.content === undefined && $this.dataset.content) {
			opt.content = $this.dataset.content;
		}
	},
	setOptionsAfter: function ($this, opt, exportObj) { },
	initBefore: null,
	initAfter: function ($this, opt, exportObj) {
		// Store event handlers for cleanup
		exportObj._clickHandler = function (e) {
			e.preventDefault();
			e.stopPropagation();
			exportObj.show();
			// Add one-time click listener to document to hide tooltip when clicking outside
			const hideOnOutsideClick = function (e) {
				if (!exportObj.$container || (!exportObj.$container.contains(e.target) && e.target !== $this)) {
					exportObj.hide();
					document.removeEventListener('click', hideOnOutsideClick);
				}
			};
			// Use setTimeout to avoid immediate trigger
			setTimeout(() => {
				document.addEventListener('click', hideOnOutsideClick);
			}, 0);
			return false;
		};

		switch (opt.trigger) {
			case 'click':
				$this.addEventListener('click', exportObj._clickHandler);
				break;
			case 'focus':
				$this.addEventListener('focusin', exportObj.show);
				$this.addEventListener('focusout', exportObj.hide);
				break;
			case 'hover':
				$this.addEventListener('mouseenter', exportObj.show);
				$this.addEventListener('mouseleave', exportObj.hide);
				break;
		}
		opt.onload && trigger(opt.onload, $this, opt, exportObj);
	},
	destroyBefore: function ($this, opt, exportObj) {
		if (opt.trigger === 'click' && exportObj._clickHandler) {
			$this.removeEventListener('click', exportObj._clickHandler);
		}
		if (opt.trigger === 'focus') {
			$this.removeEventListener('focusin', exportObj.show);
			$this.removeEventListener('focusout', exportObj.hide);
		}
		if (opt.trigger === 'hover') {
			$this.removeEventListener('mouseenter', exportObj.show);
			$this.removeEventListener('mouseleave', exportObj.hide);
		}
		if (exportObj.$container) {
			exportObj.$container.remove();
		}
	},
};
