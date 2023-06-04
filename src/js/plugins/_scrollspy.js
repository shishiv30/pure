let spyobserver = null;

function activeLink($this, key) {
	let $target = $this.find(`[href="#${key}"]`);
	if ($target[0]) {
		if (!$target.classList.contains('active')) {
			$this.find('.active').classList.remove('active');
			$target.classList.add('active');
			let $list;
			if ($this.is('[data-role*="scrollbar"]')) {
				$list = $this;
			} else {
				$list = $this.find('[data-role*="scrollbar"]');
			}
			if ($list && $list.length) {
				let scrollLeft = $list.scrollLeft();
				let scrollWidth = $list.outerWidth();
				let targetLeft = $target.position().left;
				let targetWidth = $target.outerWidth();
				if (targetLeft < 0) {
					$list.scrollLeft(scrollLeft + targetLeft - 50);
				} else if (targetLeft + targetWidth > scrollWidth) {
					$list.scrollLeft(scrollLeft + (targetLeft + targetWidth - scrollWidth + 50));
				}
			}
		}
	}
}
export default {
	name: 'scrollspy',
	defaultOpt: {
		buffer: '-10% 0px -90% 0px',
	},
	init: function ($this, opt, exportObj) {
		if (window.IntersectionObserver) {
			if (!spyobserver) {
				let $scroller = $.scrollParentY($this);
				const options = {
					root: $scroller && $scroller.length ? $scroller[0] : null,
					rootMargin: opt.buffer,
				};
				spyobserver = new window.IntersectionObserver((entries) => {
					entries.forEach((entry) => {
						if (entry.isIntersecting) {
							activeLink($this, $(entry.target).attr('id'));
						}
					});
				}, options);
				$this.find('[href^="#"]').each(function () {
					let item = $($(this).attr('href'));
					if (item && item.length) {
						spyobserver.observe(item[0]);
					}
				});
			}
		}
	},
};
