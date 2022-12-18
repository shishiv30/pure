import $ from 'cash-dom';
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import scss from './scss/index.scss';

$.debounce = debounce;
$.throttle = throttle;

window.$ = $;
window.jQuery = $;

function log(msg) {
	console.log(msg);
}

function err(err) {
	console.error(err);
}

class base {
	constructor() {
		this.name = 'base';
	}

	onInit() {
		log('init');
	}
	onLoad() {
		log('load');
	}
	onLoaded() {
		log('loaded');
	}
	onRender() {
		log('render');
	}
	onRendered() {
		log('rendered');
	}
	onDestroy() {
		log('destroy');
	}
	onDestoried() {
		log('destoried');
	}
}

class page extends base {
	constructor() {
		super();
		this.name = 'page';
		this.data = {};
	}

	async init(data) {
		//init
		super.onInit();

		//load page data
		super.onLoad();
		this.loadCxt();
		this.data = await this.loadData(data);
		super.onLoaded();

		//render page
		super.onRender();
		this.render();
		super.onRendered();
	}

	render() {
		super.onRender();
		this.renderComponent();
		super.onRendered();
	}

	destroy() {
		this.destroy();
	}
	destroy() {
		log('destroying ');
	}
	loadCxt(ctx) {
		log('loadCxt');
		this.getCtxByUrl();
		this.getCtxByCookie();
		this.getCtxByStorage();
	}

	async loadData(data) {
		log('loadingData');
		return new Promise((resolve, reject) => {
			if (data) {
				return resolve(data);
			}
			try {
				setTimeout(() => {
					return resolve({});
				}, 1000);
			} catch (e) {
				err(e);
				return resolve({});
			}
		});
	}

	getCtxByUrl(path) {
		log('getingCtxByPath');
	}

	getCtxByCookie(cookie) {
		log('getCtxByCookie');
	}

	getCtxByStorage(storage) {
		log('getCtxByStorage');
	}
	renderComponent() {
		log('renderComponent');
	}
}

class component extends base {
	constructor() {
		super();
		this.name = 'component';
	}
}
