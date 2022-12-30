import Plugin from './plugin.js';
import { logInfo, logError } from './log.js';
import { isMobile } from './validate.js';
import { select, selectAll } from './query.js';
import { emit, on } from './event.js';
import throttle from 'lodash/throttle';

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
		let that = this;
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
				Page.eventListener.apply(that);
			},
		};
	}
	static scrollTop() {
		return window.pageYOffset || document.documentElement.scrollTop;
	}
	static isLandscape() {
		return window.innerWidth > window.innerHeight;
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
	static init;

	onResize() {
		this.ctx.width = Page.getWidth();
		this.ctx.height = Page.getHeight();
		this.ctx.isLandscape = Page.isLandscape();
		if (this.ctx.isLandscape) {
			select('body').classList.add('landscape');
			select('body').classList.remove('portrait');
		} else {
			select('body').classList.add('portrait');
			select('body').classList.remove('landscape');
		}
		emit('dom.resize');
	}

	onScroll() {
		this.ctx.originalScrollTop = this.ctx.scrollTop;
		this.ctx.scrollTop = Page.scrollTop();
		if (this.ctx.scrollTop > this.ctx.originalScrollTop) {
			this.ctx.isScrollDown = true;
		} else {
			this.ctx.isScrollDown = false;
		}
		if (this.ctx.isScrollDown) {
			select('body').classList.add('scroll-down');
		} else {
			select('body').classList.remove('scroll-down');
		}
		emit('dom.scroll');
	}

	static initCtxByWindow() {
		return {
			isLandscape: Page.isLandscape(),
			scrollTop: Page.scrollTop(),
			height: Page.getHeight(),
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
				selectAll('[data-role]').forEach((item) => {
					if (item.hasAttribute('loaded')) {
						return;
					}
					let data = item.dataset;
					let types = item.getAttribute('data-role');
					if (!types) {
						return;
					}
					item.setAttribute('loaded', true);
					types = types.trim(' ').split(/\s+/g);
					types.forEach((type) => {
						let pluginName = Plugin.namespace + '_' + type;
						let plugin = Plugin.getPluginByName(pluginName);
						if (plugin) {
							plugin.call(item, data);
						}
					});
				});
			}),
		);
		window.addEventListener(
			'resize',
			throttle(() => {
				if (!Page.inputing()) {
					this.onResize();
				}
			}),
		);
		window.addEventListener(
			'scroll',
			throttle(() => {
				this.onScroll();
			}),
		);
	}
}
export default Page;
