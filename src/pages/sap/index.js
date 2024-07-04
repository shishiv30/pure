import { defBool, defEnum } from '../../js/core/def.js';
import { Plugin } from '../../js/core/plugin.js';
import { main } from '../../js/index.js';
// eslint-disable-next-line no-unused-vars
import scss from '../../scss/sap.scss';

const boolStatus = ['lock', 'collapse'];
const defBoolStatus = function (status, $el, opt, exportObj) {
	status.forEach((name) => {
		defBool(name, $el, opt, exportObj);
	});
};

const enumStatus = [
	{
		key: 'view',
		names: ['list', 'map', 'photo', 'nav'],
	},
];
const defEnumStatus = function (status, $el, opt, exportObj) {
	status.forEach((e) => {
		defEnum(e.key, e.names, $el, opt, exportObj);
	});
};

let sap = {
	name: 'sap',
	init: function ($el, opt, exportObj) {
		defBoolStatus(boolStatus, $el, opt, exportObj);
		defEnumStatus(enumStatus, $el, opt, exportObj);
	},
	load: function ($el, opt, exportObj) {
		return new Promise((resolve) => {
			setTimeout(() => {
				if (opt && opt.data) {
					Object.assign(exportObj, opt.data);
				}
				resolve(exportObj);
			}, 1000);
		});
	},
};

export default (function (win) {
	main(win, sap);
})(window);
