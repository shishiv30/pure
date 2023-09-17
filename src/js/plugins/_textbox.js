import { emit } from '../core/event.js';
import { select, hasInput } from '../core/query.js';

export default {
	name: 'textbox',
	defaultOpt: {},
	init: function ($el, opt, exportObj) {
		let $input = $el.querySelector('input') || $el.querySelector('textarea');
		if (!$input) {
			return null;
		}
		let _switchLabel = function () {
			if (hasInput($input)) {
				$el.classList.add('focus');
			} else {
				$el.classList.remove('focus');
			}
		};
		$input.addEventListener('focusin', function () {
			$el.classList.add('focus');
		});
		$input.addEventListener('focusout', function () {
			if (!$input.value) {
				$el.classList.remove('focus');
			}
		});
		$input.addEventListener('change', _switchLabel);
		_switchLabel();
	},
	setOptionsBefore: null,
	setOptionsAfter: null,
	initBefore: null,
	initAfter: null,
	destroyBefore: null,
};
