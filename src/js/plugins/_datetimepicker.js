export default {
	name: 'datetimepicker',
	defaultOpt: {
		picktype: null,
	},
	initBefore: null,
	init: function ($this, opt, exportObj) {
		let setting = {
			container: $this.offsetParent(),
			todayBtn: true,
			autoclose: true,
			todayHighlight: true,
			viewSelect: 4,
		};
		switch (opt.picktype) {
			case 'date':
				$.extend(setting, {
					format: 'yyyy-mm-dd',
					startView: 2,
					minView: 2,
					maxView: 4,
				});
				break;
			case 'time':
				$.extend(setting, {
					showMeridian: true,
					format: 'hh:ii',
					startView: 1,
					minView: 0,
					maxView: 1,
					keyboardNavigation: false,
				});
				break;
			default:
				$.extend(setting, {
					format: 'yyyy-mm-dd hh:ii',
				});
				break;
		}
		$this.datetimepicker(setting);
		exportObj.original = function () {
			return $this.data('datetimepicker');
		};
	},
	isThirdPart: true,
	setOptionsBefore: null,
	setOptionsAfter: null,
	destroyBefore: null,
	initAfter: null,
};
// $.cui.plugin(pickerContext);
// $(document).addEventListener('focus', '[data-picker]', function () {
//     let $this = $(this);
//     let opt = $this.data();
//     $this.remov.dataset.picker;
//     $this.picker(opt);
//     $this.attr('data-picker-load', '');
// });
