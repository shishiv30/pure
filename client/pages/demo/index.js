import { defBool, defEnum } from '../../js/core/def.js';
import { main } from '../../js/index.js';
import { Router } from '../../js/core/router.js';
import { emit } from '../../js/core/event.js';
import {
	createDemoSpaRegExp,
	DEMO_SPA_ROUTES,
} from '../../../helpers/routes/demoSpaRoutes.js';
import { buildDemoSpaInnerHtml } from './detailSpa.js';
import '../../scss/demo.scss';

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
	if (root) {
		root.outerHTML = detailSection.outerHTML;
	} else {
		// Geo SSR has no detail block — insert mount before nearby results.
		const resultEl = document.querySelector(demoSpaNearbySel);
		const anchor =
			resultEl ||
			document.querySelector('.breadcrumb') ||
			document.querySelector('body');
		if (!anchor) {
			return false;
		}
		if (resultEl) {
			resultEl.insertAdjacentElement('beforebegin', detailSection);
		} else if (anchor !== document.body) {
			anchor.insertAdjacentElement('afterend', detailSection);
		} else {
			anchor.appendChild(detailSection);
		}
	}
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
		/** @type {AbortController|null} */
		let detailAbort = null;
		let detailRequestId = 0;

		enumStatus.forEach((e) => {
			defEnum(e.key, e.names, $el, opt, exportObj);
		});

		/**
		 * Restore pre-detail grid markup after SPA inject replaced it.
		 * @returns {boolean}
		 */
		function restoreGridSnapshots() {
			if (!gridSnapshot) {
				return false;
			}
			const root =
				document.querySelector(demoSpaRootSel) ||
				document.querySelector('section.detail');
			if (root) {
				root.outerHTML = gridSnapshot;
			}
			if (resultSnapshot) {
				const resultEl = document.querySelector(demoSpaNearbySel);
				if (resultEl) {
					resultEl.outerHTML = resultSnapshot;
				}
			}
			emit('dom.load');
			return true;
		}

		exportObj.updateDetail = function (prId) {
			if (detailAbort) {
				detailAbort.abort();
			}
			detailAbort = new AbortController();
			const { signal } = detailAbort;
			const requestId = ++detailRequestId;

			return fetch(`/api/demo/detail/${encodeURIComponent(prId)}`, { signal })
				.then((r) => {
					if (!r.ok) {
						throw new Error(`Detail request failed (${r.status})`);
					}
					return r.json();
				})
				.then((envelope) => {
					if (requestId !== detailRequestId) {
						return false;
					}
					if (!envelope || envelope.code !== 200 || envelope.error) {
						throw new Error(
							(typeof envelope?.error === 'string' && envelope.error) ||
								'Detail request failed',
						);
					}
					const root =
						document.querySelector(demoSpaRootSel) ||
						document.querySelector('section.detail');
					if (gridSnapshot === null && root) {
						gridSnapshot = root.outerHTML;
						const resultEl = document.querySelector(demoSpaNearbySel);
						if (resultEl) {
							resultSnapshot = resultEl.outerHTML;
						}
					}
					const html = buildDemoSpaInnerHtml(envelope.data);
					if (html && injectDemoSpaHtml(html)) {
						if (window.context && envelope.data) {
							Object.assign(window.context, envelope.data);
						}
						emit('dom.load');
						return true;
					}
					return false;
				})
				.catch((err) => {
					if (err && err.name === 'AbortError') {
						return false;
					}
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
					loading: async (to) => {
						const propertyId = to.params[DEMO_SPA_ROUTES.detail.prIdParamIndex];
						if (to.pathname === window.location.pathname) {
							return null;
						}
						const detailLoaded = await exportObj.updateDetail(propertyId);
						if (detailLoaded) {
							exportObj.switchToDetail();
						} else {
							restoreGridSnapshots();
							exportObj.switchToGrid();
						}
						return null;
					},
				},
				{
					reg: createDemoSpaRegExp('map'),
					loading: async () => {
						exportObj.switchToMap();
						return null;
					},
				},
				{
					reg: createDemoSpaRegExp('geo'),
					loading: async () => {
						restoreGridSnapshots();
						exportObj.switchToGrid();
						return null;
					},
				},
			],
			{ linkScope: 'demo' },
		);
	},
	load: function ($el, opt, exportObj) {
		if (window.context?.detail) {
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
	// Plugin lifecycle slot (Page still runs renderBefore/After).
	render: function () {},
};

export default (function (win) {
	window.page = main(win, demo);
})(window);
