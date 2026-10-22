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

		function syncBar() {
			if (!bar) {
				return;
			}
			bar.classList.toggle('changed', buttons.some((button) => button.classList.contains('selected')));
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
				panel.hidden = panel.dataset.id !== id;
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
			$el.classList.remove('closing');
			$el.classList.add('close');
			list.querySelectorAll('[data-id]').forEach((panel) => {
				panel.hidden = true;
			});
			list.style.width = '';
		}

		function onFlyOut(event) {
			if (event.target !== list || event.animationName !== 'group-dropdown-fly-out') {
				return;
			}
			hideList();
		}

		function cancelHide() {
			window.clearTimeout(hideTimer);
			list.removeEventListener('animationend', onFlyOut);
			$el.classList.remove('closing');
		}

		function close() {
			buttons.forEach((button) => button.classList.remove('opened'));
			if (!list || !$el.classList.contains('open')) {
				$el.classList.remove('open', 'closing');
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
			buttons.forEach((item) => item.classList.remove('opened'));
			button.classList.add('opened');
			$el.classList.add('open');
			$el.classList.remove('close');
			if (switching) {
				const prevWidth = list.offsetWidth;
				const prevLeft = list.offsetLeft;
				showPanel(button.dataset.target);
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
			showPanel(button.dataset.target);
			placeList(button);
		}

		exportObj.open = open;
		exportObj.close = close;

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
				panel.addEventListener('change', () => syncSelected(id));
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
	initAfter: null,
	destroyBefore: null,
};
