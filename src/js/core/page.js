import Plugin from './plugin.js';
import { logInfo, logError } from './log.js';
import { isMobile } from './validate.js';
import { emit, on } from './event.js';
import throttle from 'lodash/throttle.js';
import debounce from 'lodash/debounce.js';

class Page extends Plugin {
	constructor(ctx) {
		if (!ctx) {
			logError('ctx is required');
		}
		let setting = Page.getSettingByCtx(ctx);
		super(setting, 'page');
		this.ctx = ctx;
	}

	static getSettingByCtx(ctx) {
		return {
			name: ctx.name || 'page',
			init: function () {
				logInfo('initing');
				Object.assign(ctx, Page.initCtxByWindow(ctx));
				Object.assign(ctx, Page.initCtxByUa(ctx));
				Object.assign(ctx, Page.initCtxByUrl(ctx));
				Object.assign(ctx, Page.initCtxByCookie(ctx));
				Object.assign(ctx, Page.initCtxByStorage(ctx));
				return ctx;
			},
			load: function () {
				logInfo('loading');
				return new Promise((resolve) => {
					if (ctx.data) {
						return resolve(ctx.data);
					}
					try {
						setTimeout(() => {
							let data = {};
							Object.assign(ctx, data);
							return resolve(data);
						}, 1000);
					} catch (e) {
						logError(e);
						return resolve({});
					}
				});
			},
			render: function () {
				// Page.renderComponent();
				Page.eventListener();
				emit('dom.load');
			},
		};
	}
	static getScrollTop() {
		return window.scrollY || document.documentElement.scrollTop;
	}
	static isLandscape() {
		return Page.width > Page.height;
	}
	static getHeight() {
		return window.innerHeight;
	}
	static getWidth() {
		return window.innerWidth;
	}
	static inputing() {
		let tagName = document.activeElement ? document.activeElement.tagName : '';
		return ['TEXTAREA', 'INPUT', 'SELECT'].indexOf(tagName) > -1;
	}
	static recycler() {
		//trigger this function when you want to recycle the page
		// for()
		this.reclyInstance();
	}
	static init;
	static width;
	static height;
	static landscape;
	static scrollTop;
	static originalScrollTop;

	static onResize() {
		Page.updatePageInfo();
		if (Page.landscape) {
			document.querySelector('body').classList.add('landscape');
			document.querySelector('body').classList.remove('portrait');
		} else {
			document.querySelector('body').classList.add('portrait');
			document.querySelector('body').classList.remove('landscape');
		}
		emit('dom.resize');
	}

	static onScroll() {
		Page.originalScrollTop = Page.scrollTop;
		Page.scrollTop = Page.getScrollTop();
		if (Page.scrollTop > Page.originalScrollTop) {
			Page.isScrollDown = true;
		} else {
			Page.isScrollDown = false;
		}
		if (Page.isScrollDown) {
			document.querySelector('body').classList.add('scroll-down');
		} else {
			document.querySelector('body').classList.remove('scroll-down');
		}
		emit('dom.scroll');
	}

	static updatePageInfo() {
		Page.width = Page.getWidth();
		Page.height = Page.getHeight();
		Page.scrollTop = Page.getScrollTop();
		Page.landscape = Page.isLandscape();
	}

	static initCtxByWindow() {
		Page.updatePageInfo();
		return {
			isLandscape: Page.height,
			scrollTop: Page.width,
			height: Page.height,
			width: Page.getWidth(),
		};
	}

	static initCtxByUa(ctx) {
		logInfo('initCtxByUa');
		let dataFromUa = {};
		if (ctx.isMobile === undefined) {
			dataFromUa.isMobile = isMobile(window.navigator.userAgent);
		}
		return dataFromUa;
	}

	static initCtxByUrl() {
		logInfo('initCtxByUrl');
		let dataFromUrl = {};
		return dataFromUrl;
	}

	static initCtxByCookie() {
		logInfo('initCtxByCookie');
		let dataFromCookie = {};
		return dataFromCookie;
	}

	static initCtxByStorage() {
		logInfo('initCtxByStorage');
		let dataFromStorage = {};
		return dataFromStorage;
	}

	static eventListener() {
		logInfo('add event for renderComponent');
		on(
			'dom.load',
			throttle(() => {
				// the interface wil be follow ARIA which is nice for more accessibility
				document.querySelectorAll('[data-role]').forEach((item) => {
					if (item.hasAttribute('loaded')) {
						return;
					}
					let data = item.dataset;
					let types = item.getAttribute('data-role');
					if (!types) {
						return;
					}
					item.setAttribute('loaded', true);
					types = types.trim().split(/\s+/g);
					types.forEach((type) => {
						let plugin = Plugin.getPlugin(type);
						if (plugin) {
							plugin(item, data);
						}
					});
				});
			}),
		);
		window.addEventListener(
			'resize',
			debounce(() => {
				if (!Page.inputing()) {
					Page.onResize();
				}
			}, 100),
		);
		window.addEventListener(
			'scroll',
			debounce(() => {
				Page.onScroll();
			}, 100),
		);
	}
}
export default Page;
