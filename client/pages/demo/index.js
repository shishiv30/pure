import { defBool, defEnum } from '../../js/core/def.js';
import { main } from '../../js/index.js';
import { Router } from '../../js/core/router.js';
import scss from '../../scss/demo.scss';

// eslint-disable-next-line no-unused-vars
const boolStatus = ['lock', 'collapse', 'menu'];

const enumStatus = [
	{
		key: 'view',
		names: ['grid', 'detail', 'map'],
	},
];

let demo = {
	name: 'demo',
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
		if (window.location.pathname.indexOf('/demo/sitemap') > -1) {
			return;
		}
		let tmp = new Router([
			{
				reg: /^\/(demo|demo.html)$/i,
				loading: () => {
					return new Promise((resolve) => {
						exportObj.switchToGrid();
						resolve(null);
					});
				},
			},
			{
				reg: /^\/demo\/detail\/(\w+)/i,
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
				reg: /^\/demo\/menu\/(\w+)/i,
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
				reg: /^\/demo\/*/i,
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
	render: function ($el, opt, exportObj) { },
};

export default (function (win) {
	window.page = main(win, demo);
})(window);
