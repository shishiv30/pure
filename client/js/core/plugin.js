import loadMap from './load.map.js';
import { emit, trigger } from './event.js';
import { logError, logInfo } from './log.js';
import { Base } from './base.js';
let id = 0;
export class Plugin extends Base {
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
	static instance = {};

	static getPlugin(name) {
		return Plugin.records[Plugin.namespace + '_' + name];
	}

	static setPlugin(name, plugin) {
		if (!name || !plugin) {
			logError('plugin name or plugin is required');
			return;
		}
		Plugin.records[Plugin.namespace + '_' + name] = plugin;
	}
	static async dependenceHandler(key) {
		if (key == 'googlemap') {
			return await loadMap(window.googleMapKey);
		}
	}

	static setInstance($el, exportObj) {
		let _name = Plugin.namespace;
		let _pids = $el.dataset[_name];
		if (!exportObj._pid) {
			logError(_name + ' miss _pid');
			return;
		}
		if (_pids) {
			_pids += ',' + exportObj._pid;
		} else {
			_pids = exportObj._pid;
		}
		$el.dataset[_name] = _pids;
		Plugin.instance[exportObj._pid] = exportObj;
	}

	static getInstance($el, name) {
		let _name = Plugin.namespace;
		let _pids = $el.dataset[_name];
		if (!_pids) {
			return null;
		}
		let items = _pids.split(',');
		let _pid = items.find((item) => {
			return item.indexOf(name) > -1;
		});
		return Plugin.instance[_pid];
	}

	static reclyInstance(_pid) {
		delete Plugin.instance[_pid];
	}
	//todo what if element be removed instance cannot be recly
	static register(setting) {
		let plugin = async ($el, options) => {
			if (!$el) {
				logError('html node is required');
			}
			//if el is initialed return instance of plugin
			let exportObj = Plugin.getInstance($el, setting.name);
			if (exportObj) {
				if (options) {
					exportObj.setOptions && exportObj.setOptions(options);
				}
				return exportObj;
			} else {
				exportObj = {};
			}

			let dependences = null;
			if (setting.dependence) {
				dependences = await Plugin.dependenceHandler(setting.dependence);
			}
			await this.init($el, options, exportObj, dependences);
			Plugin.setInstance($el, exportObj);
			return exportObj;
		};
		Plugin.setPlugin(setting.name, plugin);
		// return plugin;
	}

	initBefore($el, options, exportObj) {
		logInfo('init' + (options && options.role ? ' ' + options.role : ''));
		if (this.setting.initBefore) {
			trigger(this.setting.initBefore, $el, options, exportObj);
		}
	}
	initAfter($el, options, exportObj) {
		logInfo('inited' + (options && options.role ? ' ' + options.role : ''));
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

	async init($el, options, exportObj = {}) {
		//init
		var opt = Object.assign({}, this.setting.defaultOpt, {
			...options,
			...{ _pid: `${this.setting.name}_${id++}` },
		});
		exportObj._pid = opt._pid;
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
		return exportObj;
	}
}
