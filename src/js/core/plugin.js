import loadMap from './load.map.js';
import { emit, trigger } from './event.js';
import { logError, logInfo } from './log.js';
import Base from './base.js';
class Plugin extends Base {
	constructor(setting) {
		super(setting.name, 'plugin');
		let defaultSetting = {
			name: '',
			defaultOpt: {},
			init: null,
			load: null,
			render: null,
			destroy: null,
		};
		const assginSetting = Object.assign(defaultSetting, setting);
		let plugin = Plugin.getPlugin(assginSetting.name);
		this.setting = assginSetting;
		if (!plugin) {
			Plugin.register.apply(this, [assginSetting]);
		}
	}
	static namespace = 'cui';
	static records = {};

	static getPlugin(name) {
		return Plugin.records[Plugin.namespace + '_' + name];
	}
	static dependenceHandler(key) {
		if (key == 'googlemap') {
			return loadMap(window.googleMapKey);
		}
	}

	static register(setting) {
		let name = Plugin.namespace + '_' + setting.name;
		let that = this;
		let plugin = function ($el, options) {
			if (!$el) {
				logError('html node is required');
			}
			//if el is inited return instance of plugin
			let exportObj = $el.dataset[setting.name];
			if (exportObj && typeof exportObj !== 'string') {
				if (options) {
					exportObj.setOptions && exportObj.setOptions(options);
				}
				return exportObj;
			} else {
				exportObj = {};
			}
			//else init plugin
			var excutePlugin = function () {
				that.init($el, options, exportObj);
				$el.dataset[setting.name] = exportObj;
				return exportObj;
			};
			if (setting.dependence) {
				Plugin.dependenceHandler(setting.dependence).then(function () {
					return excutePlugin();
				});
			} else {
				return excutePlugin();
			}
		};
		Plugin.records[name] = plugin;
		// return plugin;
	}

	initBefore($el, options, exportObj) {
		logInfo('init');
		if (this.setting.initBefore) {
			trigger(this.setting.initBefore, $el, options, exportObj);
		}
	}
	initAfter($el, options, exportObj) {
		logInfo('inited');
		if (this.setting.initAfter) {
			trigger(this.setting.initAfter, $el, options, exportObj);
		}
	}
	loadBefore($el, options, exportObj) {
		logInfo(`${options && options.role ? options.role + ' ' : ''}load`);
		if (this.setting.loadBefore) {
			trigger(this.setting.loadBefore, $el, options, exportObj);
		}
	}
	loadAfter($el, options, exportObj) {
		logInfo(`${options && options.role ? options.role + ' ' : ''}loaded`);
		if (this.setting.loadAfter) {
			trigger(this.setting.loadAfter, $el, options, exportObj);
		}
	}
	renderBefore($el, options, exportObj) {
		logInfo(`${options && options.role ? options.role + ' ' : ''}render`);
		if (this.setting.renderBefore) {
			trigger(this.setting.renderBefore, $el, options, exportObj);
		}
	}
	renderAfter($el, options, exportObj) {
		logInfo(`${options && options.role ? options.role + ' ' : ''}rendered`);
		if (this.setting.renderAfter) {
			trigger(this.setting.renderAfter, $el, options, exportObj);
		}
	}
	destroyBefore($el, options, exportObj) {
		logInfo(`${options && options.role ? options.role + ' ' : ''}destroy`);
		if (this.setting.destroyBefore) {
			trigger(this.setting.destroyBefore, $el, options, exportObj);
		}
	}
	destroyAfter($el, options, exportObj) {
		logInfo(`${options && options.role ? options.role + ' ' : ''}destoried`);
		if (this.setting.destroyAfter) {
			trigger(this.setting.destroyAfter, $el, options, exportObj);
		}
	}

	async init($el, options, exportObj) {
		//init
		var opt = Object.assign({}, this.setting.defaultOpt, options);

		this.initBefore($el, opt, exportObj);
		if (this.setting.init) {
			this.setting.init.apply(this, [$el, opt, exportObj]);
		}
		this.initAfter($el, opt, exportObj);

		//load page data
		this.loadBefore($el, opt, exportObj);
		if (this.setting.load) {
			await this.setting.load.apply(this, [$el, opt, exportObj]);
		}
		this.loadAfter($el, opt, exportObj);

		//render page
		this.renderBefore($el, opt, exportObj);
		if (this.setting.render) {
			this.setting.render.apply(this, [$el, opt, exportObj]);
		}
		this.renderAfter($el, opt, exportObj);
	}
}
export default Plugin;
