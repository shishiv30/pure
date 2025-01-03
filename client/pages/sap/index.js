import { defBool, defEnum } from '../../js/core/def.js';
import { Plugin } from '../../js/core/plugin.js';
import { main } from '../../js/index.js';
import { Router } from '../../js/core/router.js';
import scss from '../../scss/sap.scss';

// eslint-disable-next-line no-unused-vars
const boolStatus = ['lock', 'collapse'];

const enumStatus = [
	{
		key: 'view',
		names: ['grid', 'detail', 'index'],
	},
];

let sap = {
	name: 'sap',
	init: function ($el, opt, exportObj) {
		boolStatus.forEach((name) => {
			defBool(name, $el, opt, exportObj);
		});
		enumStatus.forEach((e) => {
			defEnum(e.key, e.names, $el, opt, exportObj);
		});
		let tmp = new Router([
			{
				reg: /^\/(sap|sap.html)$/i,
				loading: () => {
					return new Promise((resolve) => {
						exportObj.switchToGrid();
						resolve(null);
					});
				},
			},
			{
				reg: /^\/sap\/grid\/(\w+)$/i,
				loading: () => {
					return new Promise((resolve) => {
						exportObj.switchToGrid();
						resolve(null);
					});
				},
			},
			{
				reg: /^\/sap\/detail\/(\w+)/i,
				loading: () => {
					return new Promise((resolve) => {
						exportObj.switchToDetail();
						resolve(null);
					});
				},
			},
			{
				reg: /^\/sap\/index/i,
				loading: () => {
					return new Promise((resolve) => {
						exportObj.switchToIndex();
						resolve(null);
					});
				},
			},
		]);
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
	render: function ($el, opt, exportObj) {},
};

export default (function (win) {
	window.page = main(win, sap);
})(window);
