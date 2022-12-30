import loadMap from './load.map.js';
import { emit } from './event.js';
import { logInfo } from './log.js';
import Base from './base.js';
class Plugin extends Base {
	constructor(setting) {
		super(setting.name, 'plugin');
		let defaultSetting = {
			name: '',
			defaultOption: {},
			init: null,
			load: null,
			render: null,
			destroy: null,
		};
		const assginSetting = Object.assign(defaultSetting, setting);
		if (!Plugin.isRegisted(assginSetting.name)) {
			Plugin.register.apply(this, [assginSetting]);
		}
		this.setting = assginSetting;
	}
	static namespace = 'cui';
	static records = {};

	static getPluginByName(name) {
		return window[Plugin.namespace + '_' + name];
	}
	static isRegisted = function (key) {
		return Plugin.records[key] !== undefined;
	};
	static dependenceHandler(key) {
		if (key == 'googlemap') {
			return loadMap(window.googleMapKey);
		}
	}

	static register(setting) {
		var name = Plugin.namespace + '_' + setting.name;
		var that = this;

		Plugin.records[name] = function (options) {
			var exportObj = this.dataset(setting.name);
			if (exportObj && typeof exportObj !== 'string') {
				if (options) {
					exportObj.setOptions && exportObj.setOptions(options);
				}
				return exportObj;
			}
			//todo start made all lifecircle point handler only return function as handler
			var excutePlugin = function () {
				var obj = that.create(this, options);
				this.dataset(setting.name, obj);
				return obj;
			};
			if (setting.dependence) {
				Plugin.dependenceHandler(setting.dependence).then(function () {
					excutePlugin();
				});
			} else {
				return excutePlugin();
			}
		};
	}

	trigger(name) {
		var params = Array.prototype.slice.call(arguments);
		params = params.slice(1, params.length);
		if (typeof name === 'function') {
			name.apply(this, params);
		} else if (typeof name === 'string') {
			if (typeof window[name] === 'function') {
				window[name].apply(this, params);
			} else {
				emit.apply(this, [name, params]);
			}
		}
	}
	onInit() {
		logInfo('init');
		if (this.setting.onInit) {
			this.trigger(this.setting.onInit);
		}
	}
	onInited() {
		logInfo('inited');
		if (this.setting.onInited) {
			this.trigger(this.setting.onInited);
		}
	}
	onLoad() {
		logInfo('load');
		if (this.setting.onLoad) {
			this.trigger(this.setting.onLoad);
		}
	}
	onLoaded() {
		logInfo('loaded');
		if (this.setting.onLoaded) {
			this.trigger(this.setting.onLoaded);
		}
	}
	onRender() {
		logInfo('render');
		if (this.setting.onRender) {
			this.trigger(this.setting.onRender);
		}
	}
	onRendered() {
		logInfo('rendered');
		if (this.setting.onRendered) {
			this.trigger(this.setting.onRendered);
		}
	}
	onDestroy() {
		logInfo('destroy');
		if (this.setting.onDestroy) {
			this.trigger(this.setting.onDestroy);
		}
	}
	onDestoried() {
		logInfo('destoried');
		if (this.setting.onDestoried) {
			this.trigger(this.setting.onDestoried);
		}
	}

	async init() {
		//init
		this.onInit();
		if (this.setting.init) {
			this.setting.init.call(this);
		}
		this.onInited();

		//load page data
		this.onLoad();
		if (this.setting.load) {
			await this.setting.load.call(this);
		}
		this.onLoaded();

		//render page
		this.onRender();
		if (this.setting.render) {
			this.setting.render.call(this);
		}
		this.onRendered();
	}
}
export default Plugin;
