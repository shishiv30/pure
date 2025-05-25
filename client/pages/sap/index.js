import { defBool, defEnum } from '../../js/core/def.js';
import { main } from '../../js/index.js';
import { Router } from '../../js/core/router.js';
import scss from '../../scss/sap.scss';

// eslint-disable-next-line no-unused-vars
const boolStatus = ['lock', 'collapse', 'menu'];

const enumStatus = [
	{
		key: 'view',
		names: ['grid', 'detail', 'map'],
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
		exportObj.updateDetail = function (id) {
			//update detail content
			console.log('updateDetail', id);
		};
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
				reg: /^\/sap\/detail\/(\w+)/i,
				loading: (to) => {
					return new Promise((resolve) => {
						exportObj.updateDetail(to.params[0]);
						exportObj.switchToDetail();
						document.querySelector('.detail').scrollIntoView({
							behavior: 'smooth',
						});
						resolve(null);
					});
				},
			},
			{
				reg: /^\/sap\/menu\/(\w+)/i,
				loading: ({ pathname }) => {
					return new Promise((resolve) => {
						if (pathname.indexOf('close') > -1) {
							exportObj.removeMenu();
						} else {
							exportObj.addMenu();
						}
						resolve(null);
					});
				},
			},
			{
				reg: /^\/sap\/*/i,
				loading: () => {
					return new Promise((resolve) => {
						exportObj.switchToGrid();
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
