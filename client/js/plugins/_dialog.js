import { trigger } from '../core/event.js';
import { logError } from '../core/log.js';

/**
 * HTML dialog element: showModal() / close().
 * Trigger: data-role="dialog" data-target="#dialogId"
 * Close: [data-dialog="close"]; optional backdrop click when autoclose is true.
 */
export default {
	name: 'dialog',
	defaultOpt: {
		autoclose: true,
		beforeOpen: null,
		afterOpen: null,
		beforeClose: null,
		afterClose: null,
		target: null,
	},
	init: function ($el, opt, exportObj) {
		let dialogEl = null;

		const resolveDialog = function () {
			if (!opt.target) {
				logError('dialog: data-target is required');
				return null;
			}
			const el = document.querySelector(opt.target);
			if (!(el instanceof HTMLDialogElement)) {
				logError('dialog: target must be a <dialog> element: ' + opt.target);
				return null;
			}
			return el;
		};

		exportObj.open = function () {
			dialogEl = resolveDialog();
			if (!dialogEl || dialogEl.open) {
				return;
			}
			opt.beforeOpen && trigger(opt.beforeOpen, $el, opt, exportObj);
			dialogEl.showModal();
			opt.afterOpen && trigger(opt.afterOpen, $el, opt, exportObj);
		};

		exportObj.close = function () {
			if (!dialogEl || !dialogEl.open) {
				dialogEl = resolveDialog();
			}
			if (!dialogEl || !dialogEl.open) {
				return;
			}
			opt.beforeClose && trigger(opt.beforeClose, $el, opt, exportObj);
			dialogEl.close();
			opt.afterClose && trigger(opt.afterClose, $el, opt, exportObj);
		};

		exportObj._bindDialog = function () {
			dialogEl = resolveDialog();
			if (!dialogEl) {
				return;
			}

			dialogEl.querySelectorAll('[data-dialog="close"]').forEach((btn) => {
				btn.addEventListener('click', function () {
					exportObj.close();
				});
			});

			if (opt.autoclose) {
				dialogEl.addEventListener('click', function (e) {
					if (e.target === dialogEl) {
						exportObj.close();
					}
				});
			}
		};
	},
	setOptionsBefore: null,
	setOptionsAfter: null,
	initBefore: null,
	initAfter: function ($el, opt, exportObj) {
		exportObj._bindDialog();
		$el.addEventListener('click', function (e) {
			e.preventDefault();
			exportObj.open();
		});
	},
	destroyBefore: function () {},
};
