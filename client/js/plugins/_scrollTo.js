import { emit } from '../core/event.js';
export default {
	name: 'scrollto',
	defaultOpt: {
		target: null,
		offsettop: null,
		beforeScroll: null,
		container: null,
		afterScroll: null,
	},
	init: function ($this, opt, exportObj) {
		$this.addEventListener('click', function (e) {
			opt.beforeScroll && emit(opt.beforeScroll, $this, opt, exportObj);
			$.scrollTo(opt.target || $this.href, opt.position);
			opt.afterScroll && emit(opt.afterScroll, $this, opt, exportObj);
			return e.preventDefault();
		});
	},

	setOptionsBefore: null,
	setOptionsAfter: null,
	initBefore: null,
	initAfter: null,
	destroyBefore: null,
};
// $.cui.plugin(scrolltoConfig);
// $(document).addEventListener('dom.load.scrollto', function () {
//     $('[data-scrollto]').forEach(function (item, index) {
//         let $this = $item;
//         let data = $this.data();
//         $this.scrollto(data);
//         $this.remov.dataset.scrollto;
//         $this.attr('data-scrollto-load', '');
//     });
// });

// $(document).addEventListener('dom.scroll.scrollSpy', function () {
//     let status = $.cui_state;
//     $('[data-scrollspy]').forEach(function () {
//         let $item = $(this);
//         let offset = $($item.dataset.offsettop);
//         let target = $($item.data('target'));
//         let top = offset ? (status.scrollTop + offset.height()) : status.scrollTop;
//         top += 50;
//         let targetTop = target.offset().top;
//         let targetBottom = target.offset().top + target.height();
//         if (targetTop <= top && targetBottom > top) {
//             emit($item.data('onscroll'), [$(this)]);
//             return false;
//         }
//     });
// });
