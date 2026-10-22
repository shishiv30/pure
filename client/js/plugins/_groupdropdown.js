const CONTROLS = 'input, select, textarea';

function controlHasValue(el) {
	if (el.disabled) {
		return false;
	}
	if (el.type === 'checkbox' || el.type === 'radio') {
		return el.checked && (el.type !== 'radio' || String(el.value || '').trim() !== '');
	}
	if (el.type === 'range' && el.dataset.empty != null) {
		return el.value !== el.dataset.empty;
	}
	return String(el.value || '').trim() !== '';
}

function panelHasValue(panel) {
	return [...panel.querySelectorAll(CONTROLS)].some(controlHasValue);
}

function clearControl(el) {
	if (el.disabled) {
		return;
	}
	if (el.type === 'checkbox' || el.type === 'radio') {
		el.checked = false;
		return;
	}
	if (el.type === 'range' && el.dataset.empty != null) {
		el.value = el.dataset.empty;
		el.dispatchEvent(new Event('input', { bubbles: true }));
		return;
	}
	el.value = '';
}

export default {
	name: 'groupdropdown',
	defaultOpt: {},
	init: function ($el, opt, exportObj) {
		const HIDE_MS = 220;
		const list = $el.querySelector('.group-dropdown-list');
		const bar = $el.querySelector('.group-dropdown-button');
		const buttons = [...$el.querySelectorAll('.group-dropdown-button button[data-target]')];
		let hideTimer = 0;
		let arrow = null;
		let overflowFrame = 0;

		if (bar && list) {
			list.id = list.id || `${$el.id || 'group-dropdown'}-list`;
			const item = document.createElement('li');
			item.className = 'group-dropdown-more';
			item.hidden = true;
			arrow = document.createElement('button');
			arrow.type = 'button';
			arrow.className = 'group-dropdown-arrow';
			arrow.setAttribute('aria-label', 'All filters');
			arrow.setAttribute('aria-expanded', 'false');
			arrow.setAttribute('aria-controls', list.id);
			item.appendChild(arrow);
			bar.appendChild(item);
			list.querySelectorAll('[data-id]').forEach((panel) => {
				const button = buttons.find((el) => el.dataset.target === panel.dataset.id);
				if (!button) {
					return;
				}
				const title = document.createElement('div');
				title.className = 'group-dropdown-title';
				title.textContent = button.textContent.trim();
				panel.insertAdjacentElement('afterbegin', title);
			});
		}

		// Show every button inline when they fit; otherwise keep only the selected ones
		// plus the arrow, which opens all panels at once.
		function checkOverflow() {
			if (!arrow) {
				return;
			}
			const items = buttons.map((button) => button.closest('li') || button);
			items.forEach((item) => item.classList.remove('collapsed'));
			arrow.parentElement.hidden = true;
			const overflow = bar.scrollWidth > bar.clientWidth + 1;
			if (overflow) {
				buttons.forEach((button, index) => {
					items[index].classList.toggle('collapsed', !button.classList.contains('selected'));
				});
				arrow.parentElement.hidden = false;
			} else if ($el.classList.contains('all') && $el.classList.contains('open')) {
				close();
			}
			$el.classList.toggle('overflow', overflow);
		}

		function scheduleOverflow() {
			window.cancelAnimationFrame(overflowFrame);
			overflowFrame = window.requestAnimationFrame(checkOverflow);
		}

		function syncBar() {
			if (!bar) {
				return;
			}
			bar.classList.toggle('changed', buttons.some((button) => button.classList.contains('selected')));
			scheduleOverflow();
		}

		const panelValue = new Map();

		function kindRoot(panel, name) {
			if (panel.classList.contains(name)) {
				return panel;
			}
			return panel.querySelector(`.${name}`);
		}

		function choiceText(el) {
			const label = el.closest('label');
			const span = label && label.querySelector('span');
			const text = span ? span.textContent : (label ? label.textContent : el.value);
			return String(text || '').trim();
		}

		function emptyRadioLabel(panel) {
			const choice = kindRoot(panel, 'radio');
			if (!choice || kindRoot(panel, 'icon-picker')) {
				return '';
			}
			const checked = [...choice.querySelectorAll('input:checked')]
				.find((el) => String(el.value || '').trim() === '');
			return checked ? choiceText(checked) : '';
		}

		function readPanelValue(panel) {
			if (!panelHasValue(panel)) {
				return { value: '', label: emptyRadioLabel(panel), html: false };
			}
			const iconPicker = kindRoot(panel, 'icon-picker');
			if (iconPicker) {
				const checked = iconPicker.querySelector('input:checked');
				const className = checked ? String(checked.value || '').trim() : '';
				const value = /^[\w-]+$/.test(className) ? `<i class="${className}"></i>` : '';
				return { value, label: value, html: true };
			}
			const choice = kindRoot(panel, 'checkbox') || kindRoot(panel, 'radio');
			if (choice) {
				const value = [...choice.querySelectorAll('input:checked')]
					.filter(controlHasValue)
					.map(choiceText)
					.filter(Boolean)
					.join(', ');
				return { value, label: value, html: false };
			}
			const output = panel.querySelector('output');
			if (output) {
				const value = output.textContent.trim();
				return { value, label: value, html: false };
			}
			const value = [...panel.querySelectorAll(CONTROLS)]
				.filter(controlHasValue)
				.map((el) => String(el.value || '').trim())
				.filter(Boolean)
				.join(', ');
			return { value, label: value, html: false };
		}

		function emitValueChange(panel) {
			const next = readPanelValue(panel);
			const prev = panelValue.get(panel);
			if (prev && prev.value === next.value && prev.label === next.label && prev.html === next.html) {
				return;
			}
			panelValue.set(panel, next);
			panel.dispatchEvent(new CustomEvent('valuechange', {
				bubbles: true,
				detail: next,
			}));
		}

		function syncSelected(id) {
			const panel = list && list.querySelector(`[data-id="${id}"]`);
			const button = buttons.find((item) => item.dataset.target === id);
			if (!panel || !button) {
				syncBar();
				return;
			}
			const selected = panelHasValue(panel);
			button.classList.toggle('selected', selected);
			const reset = button.parentElement && button.parentElement.querySelector('.group-dropdown-reset');
			if (reset) {
				reset.hidden = !selected;
			}
			syncBar();
		}

		function showPanel(id) {
			list.querySelectorAll('[data-id]').forEach((panel) => {
				panel.hidden = id != null && panel.dataset.id !== id;
			});
		}

		function targetLeft(button) {
			const item = button.closest('li') || button;
			const aligned = item.offsetLeft - bar.scrollLeft;
			const parent = list.offsetParent || $el;
			const parentLeft = parent.getBoundingClientRect().left;
			const viewportRight = document.documentElement.clientWidth;
			const overflow = parentLeft + aligned + list.offsetWidth - viewportRight;
			if (overflow > 0) {
				return Math.max(aligned - overflow, -parentLeft);
			}
			return aligned;
		}

		function placeList(button) {
			list.style.transition = 'none';
			list.style.width = '';
			list.style.left = `${targetLeft(button)}px`;
			void list.offsetWidth;
			list.style.transition = '';
		}

		function hideList() {
			if (!$el.classList.contains('closing')) {
				return;
			}
			window.clearTimeout(hideTimer);
			list.removeEventListener('animationend', onFlyOut);
			$el.classList.remove('closing', 'all');
			$el.classList.add('close');
			list.querySelectorAll('[data-id]').forEach((panel) => {
				panel.hidden = true;
			});
			list.style.width = '';
		}

		function onFlyOut(event) {
			if (event.target !== list) {
				return;
			}
			if (
				event.animationName !== 'group-dropdown-fly-out' &&
				event.animationName !== 'group-dropdown-sheet-out'
			) {
				return;
			}
			hideList();
		}

		function cancelHide() {
			window.clearTimeout(hideTimer);
			list.removeEventListener('animationend', onFlyOut);
			$el.classList.remove('closing');
		}

		function setOpened(button) {
			buttons.forEach((item) => item.classList.toggle('opened', item === button));
			if (arrow) {
				arrow.classList.toggle('opened', arrow === button);
				arrow.setAttribute('aria-expanded', String(arrow === button));
			}
		}

		function close() {
			setOpened(null);
			if (!list || !$el.classList.contains('open')) {
				$el.classList.remove('open', 'closing', 'all');
				$el.classList.add('close');
				return;
			}
			list.querySelectorAll('[data-id]').forEach((panel) => emitValueChange(panel));
			$el.classList.remove('open');
			$el.classList.add('closing');
			list.addEventListener('animationend', onFlyOut);
			hideTimer = window.setTimeout(hideList, HIDE_MS);
		}

		function open(button) {
			if (!list) {
				return;
			}
			if (button.classList.contains('opened')) {
				close();
				return;
			}
			const switching = $el.classList.contains('open');
			if ($el.classList.contains('closing')) {
				cancelHide();
			}
			const all = button === arrow;
			setOpened(button);
			$el.classList.add('open');
			$el.classList.remove('close');
			$el.classList.toggle('all', all);
			if (switching) {
				const prevWidth = list.offsetWidth;
				const prevLeft = list.offsetLeft;
				showPanel(all ? null : button.dataset.target);
				list.style.transition = 'none';
				list.style.width = 'auto';
				const nextWidth = list.offsetWidth;
				const nextLeft = targetLeft(button);
				list.style.width = `${prevWidth}px`;
				list.style.left = `${prevLeft}px`;
				void list.offsetWidth;
				list.style.transition = '';
				list.style.width = `${nextWidth}px`;
				list.style.left = `${nextLeft}px`;
				return;
			}
			showPanel(all ? null : button.dataset.target);
			placeList(button);
		}

		exportObj.open = open;
		exportObj.close = close;
		exportObj.arrow = arrow;
		exportObj.checkOverflow = checkOverflow;
		exportObj._cancelOverflow = () => window.cancelAnimationFrame(overflowFrame);

		buttons.forEach((button) => {
			const reset = document.createElement('button');
			reset.type = 'button';
			reset.className = 'group-dropdown-reset';
			reset.setAttribute('aria-label', 'Reset');
			reset.hidden = true;
			button.insertAdjacentElement('afterend', reset);
			reset.addEventListener('click', (event) => {
				event.stopPropagation();
				const panel = list && list.querySelector(`[data-id="${button.dataset.target}"]`);
				if (!panel) {
					return;
				}
				panel.dispatchEvent(new CustomEvent('reset', { bubbles: true }));
			});
			button.addEventListener('click', (event) => {
				event.stopPropagation();
				open(button);
			});
			if (button.dataset.label === 'false' || !list) {
				return;
			}
			const panel = list.querySelector(`[data-id="${button.dataset.target}"]`);
			if (!panel) {
				return;
			}
			const original = button.textContent;
			const slider = panel.querySelector('[data-role="rangeslider"]');
			const keyed = !slider && !!panel.querySelector('input[type="range"], input[type="number"]');
			panel.addEventListener('valuechange', (event) => {
				const { value, label, html } = event.detail;
				const shown = label || value;
				if (!shown) {
					button.textContent = original;
					return;
				}
				if (html) {
					button.innerHTML = shown;
					return;
				}
				button.textContent = keyed ? `${original}: ${shown}` : shown;
			});
		});

		if (list) {
			list.addEventListener('mousedown', (event) => {
				const focusable = event.target.closest('input, textarea, select');
				const shown = !!(focusable && getComputedStyle(focusable).display !== 'none');
				if (!shown) {
					event.preventDefault();
				}
			});
			list.querySelectorAll('[data-id]').forEach((panel) => {
				const id = panel.dataset.id;
				panel.addEventListener('input', () => syncSelected(id));
				panel.addEventListener('change', (event) => {
					syncSelected(id);
					// In the all-filters view, picking a choice closes the list.
					const choice = event.target.matches && event.target.matches('input[type="radio"], input[type="checkbox"]');
					if (choice && $el.classList.contains('all') && $el.classList.contains('open')) {
						close();
						arrow.focus();
					}
				});
				panel.addEventListener('reset', (event) => {
					if (event.target !== panel) {
						return;
					}
					const slider = panel.querySelector('[data-role="rangeslider"]');
					panel.querySelectorAll(CONTROLS).forEach((el) => {
						if (!slider || !slider.contains(el)) {
							clearControl(el);
						}
					});
					if (slider) {
						slider.dispatchEvent(new CustomEvent('reset'));
					}
					syncSelected(id);
					emitValueChange(panel);
					panel.dispatchEvent(new Event('change', { bubbles: true }));
				});
				syncSelected(id);
			});
			window.setTimeout(() => {
				list.querySelectorAll('[data-id]').forEach((panel) => {
					syncSelected(panel.dataset.id);
					const next = readPanelValue(panel);
					if (next.value || next.label) {
						emitValueChange(panel);
						return;
					}
					panelValue.set(panel, next);
				});
			}, 0);
		}

		$el.addEventListener('focusout', (event) => {
			if (event.relatedTarget && $el.contains(event.relatedTarget)) {
				return;
			}
			window.setTimeout(() => {
				if (!$el.contains(document.activeElement)) {
					close();
				}
			}, 0);
		});
	},
	setOptionsBefore: null,
	setOptionsAfter: null,
	initBefore: null,
	initAfter: function ($el, opt, exportObj) {
		const arrow = exportObj.arrow;
		if (!arrow) {
			return;
		}
		exportObj._arrowHandler = function (e) {
			e.stopPropagation();
			exportObj.open(arrow);
		};
		exportObj._keyHandler = function (e) {
			if (e.key !== 'Escape' || !$el.classList.contains('open')) {
				return;
			}
			const opened = $el.querySelector('.group-dropdown-button .opened');
			exportObj.close();
			if (opened) {
				opened.focus();
			}
		};
		exportObj._outsideHandler = function (e) {
			if ($el.classList.contains('open') && !$el.contains(e.target)) {
				exportObj.close();
			}
		};
		exportObj._resizeObserver = new ResizeObserver(() => exportObj.checkOverflow());
		exportObj._resizeObserver.observe($el);
		arrow.addEventListener('click', exportObj._arrowHandler);
		$el.addEventListener('keydown', exportObj._keyHandler);
		document.addEventListener('pointerdown', exportObj._outsideHandler);
		exportObj.checkOverflow();
	},
	destroyBefore: function ($el, opt, exportObj) {
		if (exportObj._cancelOverflow) {
			exportObj._cancelOverflow();
		}
		if (exportObj._resizeObserver) {
			exportObj._resizeObserver.disconnect();
			exportObj._resizeObserver = null;
		}
		if (exportObj.arrow && exportObj._arrowHandler) {
			exportObj.arrow.removeEventListener('click', exportObj._arrowHandler);
		}
		if (exportObj._keyHandler) {
			$el.removeEventListener('keydown', exportObj._keyHandler);
		}
		if (exportObj._outsideHandler) {
			document.removeEventListener('pointerdown', exportObj._outsideHandler);
		}
	},
};
