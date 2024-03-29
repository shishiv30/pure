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
// $(document).addEventListener('dom.load.locker', function () {
//     $('[data-locker]').forEach(function (item, index) {
//         let $this = $item;
//         let data = $this.data();
//         $this.remov.dataset.locker;
//         $this.locker(data);
//         $this.attr('data-locker-load', '');
//     });
// });
