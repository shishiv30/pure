/** Responsive key/value grid; min track size from --list-dict-item-width (data-item-width). */
export default {
	name: 'list-dict',
	defaultOpt: {
		itemWidth: '320px',
	},
	setOptionsBefore: function ($el, opt) {
		if (opt.itemWidth === undefined && $el.dataset.itemWidth) {
			opt.itemWidth = $el.dataset.itemWidth;
		}
	},
	init: function ($el, opt) {
		$el.style.setProperty('--list-dict-item-width', opt.itemWidth);
	},
};
