import { emit } from '../core/event.js';
export default {
	name: 'locker',
	defaultOpt: {
		onbeforelock: null,
		onafterlock: null,
		onbeforeunlock: null,
		onafterunlock: null,
	},
	init: function ($this, opt, exportObj) {
		exportObj.lock = function () {
			opt.onbeforelock && emit(opt.onbeforelock, $this, opt, exportObj);
			$this.classList.add('locked');
			opt.onafterlock && emit(opt.onafterlock, $this, opt, exportObj);
		};
		exportObj.unlock = function () {
			opt.onbeforeunlock && emit(opt.onbeforeunlock, $this, opt, exportObj);
			$this.classList.remove('locked');
			opt.onafterunlock && emit(opt.onafterunlock, $this, opt, exportObj);
		};
	},
	setOptionsBefore: null,
	setOptionsAfter: null,
	initBefore: null,
	initAfter: function ($this, opt, exportObj) {
		exportObj.lock();
	},
	destroyBefore: null,
};
// $.cui.plugin(lockerConfig);
// $(document).on('dom.load.locker', function () {
//     $('[data-locker]').each(function (index, item) {
//         var $this = $(item);
//         var data = $this.data();
//         $this.removeAttr('data-locker');
//         $this.locker(data);
//         $this.attr('data-locker-load', '');
//     });
// });
