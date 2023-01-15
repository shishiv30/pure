import {selectAll } from '../core/query.js';
var defaultSrc = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
function clean(img) {
    img.removeAttribute('data-src');
    img.removeEventListener('load', imgLoad);
    img.removeEventListener('error', imgError);
}
function imgLoad(e) {
    var img = e.target;
    if (!img) {
        return;
    }
    img.classList.add('img-load-success');
    clean(img);
}
function imgError(e) {
    var img = e.target;
    if (!img) {
        return;
    }
    img.classList.add('img-load-error');
    img.src = defaultSrc;
    clean(img);
}
function loadImg(img) {
    var imgSrc = img.getAttribute('data-src');
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
    if(!root){
        root = document;
    }
    selectAll('[data-src]', root).forEach((el) => {
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
    initBefore: function($el){
        var src = $el.getAttribute('src');
		if (src !== defaultSrc) {
			$el.getAttribute('src', defaultSrc);
			$el.getAttribute('data-src', src);
		}
    },
};
