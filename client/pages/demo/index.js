import { defBool, defEnum } from '../../js/core/def.js';
import { main } from '../../js/index.js';
import { Router } from '../../js/core/router.js';
import { emit } from '../../js/core/event.js';
import {
	createDemoSpaRegExp,
	DEMO_SPA_ROUTES,
} from '../../../helpers/routes/demoSpaRoutes.js';
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

const demoSpaRootSel = '#detail';
const demoSpaNearbySel = 'section.result';

/**
 * @param {string} html — detail + optional nearby sections from EJS
 * @returns {boolean}
 */
function injectDemoSpaHtml(html) {
	const wrap = document.createElement('div');
	wrap.innerHTML = html.trim();
	const detailSection = wrap.querySelector('#detail');
	if (!detailSection) {
		return false;
	}
	let root = document.querySelector(demoSpaRootSel);
	if (!root) {
		root = document.querySelector('section.detail');
		if (root) {
			root.id = 'detail';
		}
	}
	if (!root) {
		return false;
	}
	root.outerHTML = detailSection.outerHTML;
	const nearbySection = wrap.querySelector(demoSpaNearbySel);
	const resultEl = document.querySelector(demoSpaNearbySel);
	if (nearbySection && resultEl) {
		resultEl.outerHTML = nearbySection.outerHTML;
	}
	return true;
}

let demo = {
	name: 'demo',
	init: function ($el, opt, exportObj) {
		boolStatus.forEach((name) => {
			defBool(name, $el, opt, exportObj);
		});

		let gridSnapshot = null;
		let resultSnapshot = null;

		enumStatus.forEach((e) => {
			defEnum(e.key, e.names, $el, opt, exportObj);
		});

		exportObj.updateDetail = function (prId) {
			return fetch(`/api/demo/detail/${encodeURIComponent(prId)}`)
				.then((r) => r.json())
				.then((envelope) => {
					if (!envelope || envelope.code !== 200 || envelope.error) {
						throw new Error(
							(typeof envelope?.error === 'string' && envelope.error) ||
								'Detail request failed',
						);
					}
					const root =
						document.querySelector(demoSpaRootSel) ||
						document.querySelector('section.detail');
					if (!root) {
						return false;
					}
					if (gridSnapshot === null) {
						gridSnapshot = root.outerHTML;
						const resultEl = document.querySelector(demoSpaNearbySel);
						if (resultEl) {
							resultSnapshot = resultEl.outerHTML;
						}
					}
					const html = buildDemoSpaInnerHtml(envelope.data);
					if (html && injectDemoSpaHtml(html)) {
						if (typeof window !== 'undefined' && window.context && envelope.data) {
							Object.assign(window.context, envelope.data);
						}
						emit('dom.load');
						return true;
					}
					return false;
				})
				.catch((err) => {
					// eslint-disable-next-line no-console
					console.error('updateDetail', err);
					return false;
				});
		};

		if (window.location.pathname.indexOf('/demo/sitemap') > -1) {
			return;
		}
		return new Router(
			[
				{
					reg: createDemoSpaRegExp('detail'),
					loading: (to) => {
						return new Promise((resolve) => {
							const propertyId = to.params[DEMO_SPA_ROUTES.detail.prIdParamIndex];
							//if to is same as current path, don't load
							if (to.pathname === window.location.pathname) {
								resolve(null);
								return;
							}
							exportObj.updateDetail(propertyId).then((detailLoaded) => {
								if (detailLoaded) {
									exportObj.switchToDetail();
								} else {
									exportObj.switchToGrid();
								}
								resolve(null);
							});
						});
					},
				},
				{
					reg: createDemoSpaRegExp('map'),
					loading: () => {
						return new Promise((resolve) => {
							exportObj.switchToMap();
							resolve(null);
						});
					},
				},
				{
					reg: createDemoSpaRegExp('geo'),
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
	},
	load: function ($el, opt, exportObj) {
		if(context.detail){
			exportObj.switchToDetail();
		} else {
			exportObj.switchToGrid();
		}
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
