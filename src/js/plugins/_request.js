import { emit } from '../core/event.js';
export default {
	name: 'request',
	defaultOpt: {
		target: '',
		type: null,
		beforesend: null,
		onsuccess: null,
		onerror: null,
		datatype: null,
		lock: 1,
	},
	init: function ($this, opt, exportObj) {
		var $target = $(opt.target);
		var send = function () {
			var params = {
				type: opt.type,
				dataType: opt.datatype,
				lock: opt.lock,
			};
			if ($target) {
				if ($target.isValid()) {
					params.data = $target.getValue();
				} else {
					return false;
				}
			}
			params.beforeSend = function () {
				opt.beforesend && emit(opt.beforesend, $this, opt, exportObj);
			};
			params.success = function () {
				opt.onsuccess && emit(opt.onsuccess, $this, opt, exportObj);
			};
			params.error = function () {
				opt.onerror && emit(opt.onerror, $this, opt, exportObj);
			};
			$.ajax(params);
		};
		$this.click(send);
	},
	setOptionsBefore: null,
	setOptionsAfter: null,
	initBefore: null,
	initAfter: null,
	destroyBefore: null,
};
