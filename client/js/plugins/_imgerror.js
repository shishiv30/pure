/** Default fallback when an image fails to load (copied to dist/images/n_a.svg). */
const DEFAULT_FALLBACK = '/images/n_a.svg';

function applyFallback(img, fallbackSrc) {
	if (img.dataset.imgErrorApplied === '1') {
		return;
	}
	img.dataset.imgErrorApplied = '1';
	img.classList.add('img-load-error');
	img.src = fallbackSrc;
}

function isBroken(img) {
	return img.complete && img.naturalWidth === 0 && Boolean(img.getAttribute('src'));
}

export default {
	name: 'imgerror',
	defaultOpt: {
		fallback: DEFAULT_FALLBACK,
	},
	setOptionsBefore: function ($el, opt) {
		if (!opt.fallback && $el.dataset.fallback) {
			opt.fallback = $el.dataset.fallback;
		}
	},
	init: function ($el, opt, exportObj) {
		const fallbackSrc = opt.fallback || DEFAULT_FALLBACK;
		exportObj._errorHandler = function () {
			applyFallback($el, fallbackSrc);
		};
	},
	initAfter: function ($el, opt, exportObj) {
		$el.addEventListener('error', exportObj._errorHandler);
		if (isBroken($el)) {
			exportObj._errorHandler();
		}
	},
	destroyBefore: function ($el, opt, exportObj) {
		if (exportObj._errorHandler) {
			$el.removeEventListener('error', exportObj._errorHandler);
			exportObj._errorHandler = null;
		}
	},
};
