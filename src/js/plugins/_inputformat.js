import { emit } from '../core/event.js';
export default {
	name: 'inputformat',
	defaultOpt: {
		type: 'phone',
	},
	initBefore: null,
	init: function ($this, opt, exportObj) {
		let timer = null;
		let _get = function () {
			let value = $this.value;
			switch (opt.type) {
				case 'phone':
					return value.replace(/[^0-9]/g, '');
				case 'price':
					return value.replace(/[^0-9.]/g, '');
				default:
					return value;
			}
		};
		let _set = function () {
			let value = _get();
			let formatString = '';
			switch (opt.type) {
				case 'phone':
					if (value.length >= 4) {
						formatString += value.slice(0, 3) + '-';
						if (value.length >= 7) {
							formatString += value.slice(3, 6) + '-';
							formatString += value.slice(6, Math.min(value.length, 11));
						} else {
							formatString += value.slice(3, value.length);
						}
					} else {
						formatString += value;
					}
					break;
				case 'price':
					let arrPrice = value.toString().split('.');
					formatString = arrPrice[0];
					let pricePattern = /(\d+)(\d{3})/;
					while (pricePattern.test(formatString))
						formatString = formatString.replace(pricePattern, '$1,$2');
					if (arrPrice.length >= 2) {
						formatString += '.' + arrPrice[1];
						value = arrPrice[0] + '.' + arrPrice[1];
					}
					break;
				default:
					formatString = value;
					break;
			}
			$this.val(formatString);
			$this.prop('rawValue', value);
			return formatString;
		};

		_set();
		$this.addEventListener('input', function () {
			let $this = $(this);
			if (timer) {
				clearTimeout(timer);
			}
			timer = setTimeout(function () {
				if ($this.prop('rawValue') !== _get()) {
					let value = _set();
					$this.trigger('formatinput', [value]);
				}
			}, 10);
		});
	},

	setOptionsBefore: null,
	setOptionsAfter: null,
	destroyBefore: null,
	initAfter: null,
};
// $.cui.plugin(inputformatConfig);
// $(document).addEventListener('dom.load.inputformat', function () {
//     $('[data-inputformat]').forEach(function (item, index) {
//         let $this = $item;
//         let data = $this.data();
//         $this.removeAttr('data-inputformat');
//         $this.inputformat(data);
//         $this.removeAttr('data-inputformat-load', '');
//     });

// });
