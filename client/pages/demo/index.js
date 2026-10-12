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
const viewFlipMs = 500;

/**
 * @param {HTMLElement} page
 * @param {Object} opt
 */
function bindViewFlip(page, opt) {
	let flipToken = 0;

	function resultItems() {
		return Array.from(document.querySelectorAll(`${demoSpaNearbySel} li.item`));
	}

	function currentView() {
		if (page.classList.contains('view-detail')) {
			return 'detail';
		}
		if (page.classList.contains('view-grid')) {
			return 'grid';
		}
		return '';
	}

	function clearItemTransforms(items) {
		items.forEach((item) => {
			item.style.transition = '';
			item.style.transform = '';
		});
	}

	/**
	 * @param {HTMLElement[]} items
	 */
	function measureItems(items) {
		return items
			.map((item) => {
				const rect = item.getBoundingClientRect();
				return {
					item,
					top: rect.top,
					left: rect.left,
					width: rect.width,
					height: rect.height,
				};
			})
			.filter((entry) => entry.width > 0 && entry.height > 0);
	}

	function endFlip(token, items) {
		if (token !== flipToken) {
			return;
		}
		flipToken += 1;
		clearItemTransforms(items);
		page.classList.remove('view-animating');
	}

	/**
	 * @param {'detail'|'grid'} target
	 */
	function beginFlip(target) {
		flipToken += 1;
		const token = flipToken;
		const items = resultItems();
		const from = currentView() ? measureItems(items) : [];
		clearItemTransforms(items);
		if (!from.length) {
			opt._viewFlip = null;
			page.classList.remove('view-animating');
			return;
		}
		page.classList.add('view-animating');
		opt._viewFlip = { target, from, token };
	}

	/**
	 * @param {'detail'|'grid'} target
	 */
	function playFlip(target) {
		const pending = opt._viewFlip;
		opt._viewFlip = null;
		if (!pending || pending.target !== target || pending.token !== flipToken) {
			return;
		}
		const { from, token } = pending;
		const moves = [];
		from.forEach((prev) => {
			const next = prev.item.getBoundingClientRect();
			const dx = prev.left - next.left;
			const dy = prev.top - next.top;
			if (dx === 0 && dy === 0) {
				return;
			}
			prev.item.style.transition = 'none';
			prev.item.style.transform = `translate(${dx}px, ${dy}px)`;
			moves.push(prev.item);
		});
		if (!moves.length) {
			endFlip(token, from.map((entry) => entry.item));
			return;
		}
		requestAnimationFrame(() => {
			if (token !== flipToken) {
				return;
			}
			moves.forEach((item) => {
				item.style.transition = '';
				item.style.transform = '';
			});
			let remaining = moves.length;
			let settled = false;
			const finish = () => {
				if (settled) {
					return;
				}
				settled = true;
				moves.forEach((item) => {
					item.removeEventListener('transitionend', onEnd);
				});
				endFlip(token, from.map((entry) => entry.item));
			};
			const onEnd = (event) => {
				if (event.propertyName !== 'transform') {
					return;
				}
				remaining -= 1;
				if (remaining <= 0) {
					finish();
				}
			};
			moves.forEach((item) => {
				item.addEventListener('transitionend', onEnd);
			});
			setTimeout(finish, viewFlipMs + 80);
		});
	}

	let flyToken = 0;

	function detailBody() {
		const root =
			document.querySelector(demoSpaRootSel) || document.querySelector('section.detail');
		return root ? root.querySelector('.detail-body') : null;
	}

	function pinDetailBody(transform) {
		const body = detailBody();
		if (!body) {
			return;
		}
		body.style.transition = 'none';
		body.style.transform = transform;
	}

	function releaseDetailBody() {
		const body = detailBody();
		if (!body) {
			return;
		}
		body.style.transition = '';
		body.style.transform = '';
	}

	/**
	 * @param {'detail'|'grid'} target
	 */
	function beginFly(target) {
		flyToken += 1;
		const from = currentView();
		if (!from || !detailBody()) {
			page.classList.remove('detail-leaving');
			return;
		}
		if (target === 'grid' && from === 'detail') {
			page.classList.add('detail-leaving');
			pinDetailBody('translateX(0)');
			return;
		}
		if (target === 'detail' && from === 'grid') {
			page.classList.remove('detail-leaving');
			pinDetailBody('translateX(100%)');
		}
	}

	/**
	 * @param {'detail'|'grid'} target
	 */
	function playFly(target) {
		const token = flyToken;
		const body = detailBody();
		if (!body || !body.style.transform) {
			return;
		}
		requestAnimationFrame(() => {
			if (token !== flyToken) {
				return;
			}
			releaseDetailBody();
			if (target !== 'grid') {
				return;
			}
			let settled = false;
			const finish = () => {
				if (settled || token !== flyToken) {
					return;
				}
				settled = true;
				body.removeEventListener('transitionend', onEnd);
				page.classList.remove('detail-leaving');
			};
			const onEnd = (event) => {
				if (event.propertyName !== 'transform') {
					return;
				}
				finish();
			};
			body.addEventListener('transitionend', onEnd);
			setTimeout(finish, viewFlipMs + 80);
		});
	}

	opt.beforeSwitchToDetail = () => {
		beginFlip('detail');
		beginFly('detail');
	};
	opt.afterSwitchToDetail = () => {
		playFlip('detail');
		playFly('detail');
	};
	opt.beforeSwitchToGrid = () => {
		beginFlip('grid');
		beginFly('grid');
	};
	opt.afterSwitchToGrid = () => {
		playFlip('grid');
		playFly('grid');
	};
}

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

const detailRevealSlots = [
	'h1',
	'.demo-detail-tags',
	'.demo-slider',
	'.demo-detail-description',
];

/**
 * Replace placeholder blocks in order: title, tags, slider, description.
 * @param {string} html
 * @param {() => boolean} isCurrent
 * @returns {Promise<boolean>}
 */
function revealPlaceholder(html, isCurrent) {
	const wrap = document.createElement('div');
	wrap.innerHTML = html.trim();
	const nextBody = wrap.querySelector('.detail-body');
	const body = document.querySelector(`${demoSpaRootSel} .detail-body`);
	if (!nextBody || !body) {
		return Promise.resolve(false);
	}
	const nearbySection = wrap.querySelector(demoSpaNearbySel);
	const resultEl = document.querySelector(demoSpaNearbySel);
	if (nearbySection && resultEl) {
		resultEl.outerHTML = nearbySection.outerHTML;
	}
	const wait = (ms) => new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
	return detailRevealSlots.reduce((chain, sel) => {
		return chain.then(() => {
			if (!isCurrent()) {
				return;
			}
			const current = body.querySelector(sel);
			const next = nextBody.querySelector(sel);
			if (next) {
				next.classList.add('detail-reveal');
				if (current) {
					current.replaceWith(next);
				} else {
					body.appendChild(next);
				}
			} else if (current) {
				current.remove();
			}
			return wait(250);
		});
	}, Promise.resolve()).then(() => {
		if (!isCurrent()) {
			return false;
		}
		body.classList.remove('placeholder');
		Array.from(nextBody.children).forEach((node) => {
			node.classList.add('detail-reveal');
			body.appendChild(node);
		});
		return true;
	});
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

		bindViewFlip($el, opt);
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
			const shownId = window.context?.detail?.metadata?.prId;
			const detailRoot =
				document.querySelector(demoSpaRootSel) || document.querySelector('section.detail');
			const body = detailRoot ? detailRoot.querySelector('.detail-body') : null;
			const skeletonAt = Date.now();
			let showedSkeleton = false;
			if (body && body.childElementCount && shownId && shownId !== prId) {
				showedSkeleton = true;
				body.className = 'placeholder detail-body grid grid-xs-1';
				body.innerHTML = [
					'<h1 class="demo-title"></h1>',
					'<div class="filter demo-detail-tags"></div>',
					'<div class="slider demo-slider"></div>',
					'<div class="demo-detail-description"></div>',
				].join('');
			}
			const holdSkeleton = () => {
				if (!showedSkeleton) {
					return Promise.resolve();
				}
				const wait = Math.max(0, 1500 - (Date.now() - skeletonAt));
				return new Promise((resolve) => {
					setTimeout(resolve, wait);
				});
			};

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
					return holdSkeleton().then(() => envelope);
				})
				.then(async (envelope) => {
					if (!envelope || requestId !== detailRequestId) {
						return false;
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
					const revealed = showedSkeleton
						? await revealPlaceholder(html, () => requestId === detailRequestId)
						: false;
					if (revealed || (!showedSkeleton && html && injectDemoSpaHtml(html))) {
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
					loading: async (to, _from, method) => {
						const propertyId = to.params[DEMO_SPA_ROUTES.detail.prIdParamIndex];
						// Initial SSR replace already painted detail; popstate/push must still update.
						if (method === 'replace') {
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
