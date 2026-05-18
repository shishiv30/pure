import { defBool, defEnum } from '../../js/core/def.js';
import { main } from '../../js/index.js';
import { Router } from '../../js/core/router.js';
import { emit } from '../../js/core/event.js';
import { buildDemoSpaInnerHtml } from './detailSpa.js';
import scss from '../../scss/demo.scss';

// eslint-disable-next-line no-unused-vars
const boolStatus = ['lock', 'collapse', 'menu'];

const enumStatus = [
	{
		key: 'view',
		names: ['grid', 'detail', 'map'],
	},
];

const demoSpaRootSel = '#body';

let demo = {
	name: 'demo',
	init: function ($el, opt, exportObj) {
		boolStatus.forEach((name) => {
			defBool(name, $el, opt, exportObj);
		});

		let gridSnapshot = null;
		const userPageOpt = opt || {};
		const viewOpt = {
			...userPageOpt,
			beforeSwitchToDetail($el2, o, target) {
				const root = document.querySelector(demoSpaRootSel);
				if (root && gridSnapshot === null) {
					gridSnapshot = root.innerHTML;
				}
				if (userPageOpt.beforeSwitchToDetail) {
					userPageOpt.beforeSwitchToDetail($el2, o, target);
				}
			},
			afterSwitchToGrid($el2, o, target) {
				const root = document.querySelector(demoSpaRootSel);
				if (root && gridSnapshot != null) {
					root.innerHTML = gridSnapshot;
				}
				emit('dom.load');
				if (userPageOpt.afterSwitchToGrid) {
					userPageOpt.afterSwitchToGrid($el2, o, target);
				}
			},
		};

		enumStatus.forEach((e) => {
			defEnum(e.key, e.names, $el, viewOpt, exportObj);
		});

		exportObj.updateDetail = function (propertyId) {
			return fetch(`/api/demo/detail/${encodeURIComponent(propertyId)}`)
				.then((r) => r.json())
				.then((envelope) => {
					if (!envelope || envelope.code !== 200 || envelope.error) {
						throw new Error(
							(typeof envelope?.error === 'string' && envelope.error) ||
								'Detail request failed',
						);
					}
					const root = document.querySelector(demoSpaRootSel);
					if (!root) {
						return;
					}
					if (gridSnapshot === null) {
						gridSnapshot = root.innerHTML;
					}
					const html = buildDemoSpaInnerHtml(envelope.data);
					if (html) {
						root.innerHTML = html;
						if (typeof window !== 'undefined' && window.context && envelope.data) {
							Object.assign(window.context, envelope.data);
						}
						emit('dom.load');
					} else if (envelope.data?.detailError) {
						root.innerHTML = `<section class="detail demo-detail demo-detail-missing"><motion class="grid grid-xs-1"><h1 class="h3">Listing unavailable</h1><p>${String(envelope.data.detailError)}</p></div></section>`;
					}
				})
				.catch((err) => {
					// eslint-disable-next-line no-console
					console.error('updateDetail', err);
				});
		};

		if (window.location.pathname.indexOf('/demo/sitemap') > -1) {
			return;
		}
		const _demoSpaRouter = new Router(
			[
				{
					reg: /^\/demo\/detail\/([a-z]{2})\/([0-9a-z-]+)\/([0-9a-z-]+)\/?$/i,
					loading: (to) => {
						return new Promise((resolve) => {
							const propertyId = to.params[2];
							exportObj.switchToDetail();
							exportObj.updateDetail(propertyId).finally(() => {
								const detailEl = document.querySelector('.demo-detail');
								if (detailEl) {
									detailEl.scrollIntoView({ behavior: 'smooth' });
								}
								resolve(null);
							});
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
	render: function ($el, opt, exportObj) {},
};

export default (function (win) {
	window.page = main(win, demo);
})(window);
