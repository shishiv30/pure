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
		exportObj.updateDetail = function (id, subId) {
			// update detail content (hook for data fetch / render)
			// eslint-disable-next-line no-console
			console.log('updateDetail', id, subId);
		};
		if (window.location.pathname.indexOf('/demo/sitemap') > -1) {
			return;
		}
		const _demoSpaRouter = new Router(
			[
				{
					reg: /^\/demo\/detail\/([0-9a-z-]+)\/?$/i,

					loading: (to) => {
						return new Promise((resolve) => {
							const id = to.params && to.params[0];
							const subId = to.params && to.params[1];
							exportObj.updateDetail(id, subId);
							exportObj.switchToDetail();
							const detailEl = document.querySelector('.detail');
							if (detailEl) {
								detailEl.scrollIntoView({ behavior: 'smooth' });
							}
							resolve(null);
						});
					},
				},
				{
					reg: /^\/demo\/[a-z]{2}\/[^/]+\/@[^/]+,[^/]+\/?$/i,
					loading: () => {
						return new Promise((resolve) => {
							exportObj.switchToMap();
							resolve(null);
						});
					},
				},
				{
					reg: /^\/demo(?:\/.*)?\/?$/i,
					loading: () => {
						return new Promise((resolve) => {
							exportObj.switchToGrid();
							resolve(null);
						});
					},
				},
			],
			{ linkScope: 'demo' },
		);
		void _demoSpaRouter;
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
