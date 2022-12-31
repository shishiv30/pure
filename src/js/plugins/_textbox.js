import { emit } from '../core/event.js';
export default {
	name: 'textbox',
	defaultOpt: {},
	init: function ($this, opt, exportObj) {
		var $input = $this.find('input');
		var _switchLabel = function () {
			if ($input.val()) {
				$this.classList.add('focus');
			} else {
				$this.classList.remove('focus');
			}
		};
		if (!$input.length) {
			$input = $this.find('textarea');
		}
		$input.on('focusin', function () {
			$this.classList.add('focus');
		});
		$input.on('focusout', function () {
			if (!$input.val()) {
				$this.classList.remove('focus');
			}
		});
		$input.on('change', _switchLabel);
		_switchLabel();
	},
	setOptionsBefore: null,
	setOptionsAfter: null,
	initBefore: null,
	initAfter: null,
	destroyBefore: null,
};
