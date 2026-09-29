let defaultSrc = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
function clean(img) {
	img.setAttribute('data-src-loaded', '');
	img.removeAttribute('data-src');
	img.removeEventListener('load', imgLoad);
	img.removeEventListener('error', imgError);
}
const watched = new WeakSet();

function setImageRatio(img) {
	if (!img || !img.hasAttribute('ratio') || !img.naturalWidth || !img.naturalHeight) {
		return;
	}
	img.style.setProperty('--image-ratio', String(img.naturalWidth / img.naturalHeight));
}

function watchImg(img) {
	if (watched.has(img)) {
		return;
	}
	watched.add(img);
	const observer = new MutationObserver((records) => {
		records.forEach((record) => {
			if (record.attributeName === 'data-src') {
				loadImg(img);
				return;
			}
			img.addEventListener('load', () => setImageRatio(img), { once: true });
			if (img.complete) {
				setImageRatio(img);
			}
		});
	});
	observer.observe(img, {
		attributes: true,
		attributeFilter: ['src', 'data-src'],
	});
}

function imgLoad(e) {
	let img = e.target;
	if (!img) {
		return;
	}
	setImageRatio(img);
	clean(img);
}
function imgError(e) {
	let img = e.target;
	if (!img) {
		return;
	}
	img.classList.add('img-load-error');
	img.src = defaultSrc;
	clean(img);
}
function loadImg(img) {
	let imgSrc = img.getAttribute('data-src');
	if (imgSrc) {
		img.addEventListener('load', imgLoad);
		img.addEventListener('error', imgError);
		img.src = imgSrc;
	}
}

function observerHandle(entries) {
	entries.forEach((entry) => {
		if (!entry.isIntersecting) {
			return;
		}
		loadImg(entry.target);
		window.observer.unobserve(entry.target);
	});
}
function createObserver(el) {
	if (!window.observer) {
		const options = {
			rootMargin: '0px 0px 0px 0px',
			threshold: 0,
		};
		window.observer = new IntersectionObserver(observerHandle, options);
	}
	window.observer.observe(el);
}

function ignoreLazyLoad(el) {
	return !window.IntersectionObserver;
}

function lazyloadImg($el) {
	let root = $el;
	if (!root) {
		root = document;
	}
	root.querySelectorAll('[data-src]').forEach((el) => {
		if (el.hasAttribute('ratio')) {
			watchImg(el);
		}
		if (ignoreLazyLoad(el)) {
			loadImg(el);
		} else {
			createObserver(el);
		}
	});
}
export default {
	name: 'lazyload',
	defaultOpt: {},
	init: function ($el) {
		lazyloadImg($el);
	},
	initBefore: null,
};
