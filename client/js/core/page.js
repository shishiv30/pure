import { Plugin } from './plugin.js';
import { logInfo, logError } from './log.js';
import { isMobile } from './validate.js';
import { emit, on } from './event.js';
import throttle from 'lodash/throttle.js';
import debounce from 'lodash/debounce.js';

export class Page extends Plugin {
	constructor(ctx, pageSetting = null) {
		if (!ctx) {
			logError('ctx is required');
		}
		let setting = Page.getSettingByCtx(ctx, pageSetting);
		super(setting, setting.name || 'page');
	}

	static getSettingByCtx(ctx, setting = null) {
		return {
			name: setting && setting.name ? setting.name : 'page',
			init: function ($el, opt, exportObj) {
				if (!$el) {
					$el = document.querySelector('body');
				}
				logInfo('initing');
				Object.assign(ctx, Page.initCtxByWindow(ctx));
				Object.assign(ctx, Page.initCtxByUa(ctx));
				Object.assign(ctx, Page.initCtxByUrl(ctx));
				Object.assign(ctx, Page.initCtxByCookie(ctx));
				Object.assign(ctx, Page.initCtxByStorage(ctx));
				exportObj.ctx = ctx;
				if (setting && setting.init) {
					setting.init($el, opt, exportObj);
				}
				return exportObj;
			},
			load: async function ($el, opt, exportObj) {
				logInfo('loading');
				let data = exportObj && exportObj.ctx && exportObj.data ? exportObj.ctx.data : {};

				if (setting && setting.load) {
					try {
						let res = await setting.load($el, opt, exportObj);
						if (res && res.data) {
							exportObj.ctx = Object.assign(exportObj.ctx.data, res.data);
						}
					} catch (e) {
						logError(e);
					}
				}

				if (data) {
					exportObj.ctx.data = data;
				}
				return exportObj;
			},
			render: function ($el, opt, exportObj) {
				// Page.renderComponent();
				Page.eventListener();
				if (setting && setting.render) {
					setting.render($el, opt, exportObj);
				}
				emit('dom.load');
				return exportObj;
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
		//todo
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
		emit('dom.scroll', { scrollTop: Page.scrollTop, isScrollDown: Page.isScrollDown });
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
					let types = data.role;
					if (!types) {
						return;
					}
					item.setAttribute('loaded', 1);
					types = types.trim().split(/\s+/g);
					types.forEach((type) => {
						let plugin = Plugin.getPlugin(type);
						if (plugin) {
							plugin(item, data);
						}
					});
					item.setAttribute('loaded', 2);
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
