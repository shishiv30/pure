import { emit } from '../core/event.js';
export default {
	name: 'tabs',
	defaultOpt: {},
	init: function ($this, opt, exportObj) {
		var $items = $this.find('[data-tab]');
		var _switchActiveTab = function () {
			$items.each(function (index, item) {
				var $item = $(item);
				var $target = $($item.attr('data-target')).hide();
				if ($item.classList.contains('active')) {
					$target.show();
					$(document).trigger('dom.load.tab');
				} else {
					$target.hide();
				}
			});
		};
		$items.each(function () {
			$(this).on('click', function () {
				$items.classList.remove('active');
				$(this).classList.add('active');
				_switchActiveTab();
			});
		});
		_switchActiveTab();
	},

	setOptionsBefore: null,
	setOptionsAfter: null,
	initBefore: null,
	initAfter: null,
	destroyBefore: null,
};
