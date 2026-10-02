const CONTROLS = 'input, select, textarea';

function controlHasValue(el) {
	if (el.disabled) {
		return false;
	}
	if (el.type === 'checkbox' || el.type === 'radio') {
		return el.checked;
	}
	if (el.type === 'range' && el.dataset.empty != null) {
		return el.value !== el.dataset.empty;
	}
	return String(el.value || '').trim() !== '';
}

function panelHasValue(panel) {
	return [...panel.querySelectorAll(CONTROLS)].some(controlHasValue);
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
			bar.classList.toggle('active', buttons.some((button) => button.classList.contains('selected')));
		}

		function syncSelected(id) {
			const panel = list && list.querySelector(`[data-id="${id}"]`);
			const button = buttons.find((item) => item.dataset.target === id);
			if (!panel || !button) {
				syncBar();
				return;
			}
			button.classList.toggle('selected', panelHasValue(panel));
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
			button.addEventListener('click', (event) => {
				event.stopPropagation();
				open(button);
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
				syncSelected(id);
			});
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
