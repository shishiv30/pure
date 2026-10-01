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
		const list = $el.querySelector('.group-dropdown-list');
		const buttons = [...$el.querySelectorAll('.group-dropdown-button button[data-target]')];

		function syncSelected(id) {
			const panel = list && list.querySelector(`[data-id="${id}"]`);
			const button = buttons.find((item) => item.dataset.target === id);
			if (!panel || !button) {
				return;
			}
			button.classList.toggle('selected', panelHasValue(panel));
		}

		function close() {
			$el.classList.remove('open');
			$el.classList.add('close');
			buttons.forEach((button) => button.classList.remove('opened'));
			if (list) {
				list.querySelectorAll('[data-id]').forEach((panel) => {
					panel.hidden = true;
				});
			}
		}

		function open(button) {
			const id = button.dataset.target;
			const wasOpen = button.classList.contains('opened');
			close();
			if (wasOpen || !list) {
				return;
			}
			const panel = list.querySelector(`[data-id="${id}"]`);
			$el.classList.add('open');
			button.classList.add('opened');
			if (panel) {
				panel.hidden = false;
			}
			const item = button.closest('li') || button;
			list.style.left = `${item.offsetLeft - $el.querySelector('.group-dropdown-button').scrollLeft}px`;
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
			list.querySelectorAll('[data-id]').forEach((panel) => {
				const id = panel.dataset.id;
				panel.addEventListener('input', () => syncSelected(id));
				panel.addEventListener('change', () => syncSelected(id));
				syncSelected(id);
			});
		}

		// document.addEventListener('click', (event) => {
		// 	if (!$el.contains(event.target)) {
		// 		close();
		// 	}
		// });
	},
	setOptionsBefore: null,
	setOptionsAfter: null,
	initBefore: null,
	initAfter: null,
	destroyBefore: null,
};
