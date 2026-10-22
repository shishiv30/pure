/**
 * Client SPA router (click + popstate).
 *
 * Boot: `init()` listens for click/popstate, then `replace(location.pathname)`.
 * History updates keep `location.search` so listing filters stay in the URL.
 * Click → `push` (`loading`, then `pushState`). Back/forward → `goto` (`loading`
 * only; the browser already changed the URL). `replace` syncs the current URL.
 *
 * Rule `loading(to, from, method)` is the only hook. Do not treat
 * `to.pathname === window.location.pathname` as "initial load" — that is also
 * true for `goto`. Use `method === 'replace'` (or `from == null`) to skip work
 * SSR already painted.
 *
 * @see docs/client-js-lifecycle.md (map: client-boot)
 *
 * Deploy folder (`/pure`, `/subdomain`) is stripped before `reg` / `path` match
 * and restored when writing history, so route patterns stay rooted at `/`.
 *
 * @typedef {'push' | 'replace' | 'goto'} NavigationMethod
 *
 * @typedef {Object} RouteState
 * @property {RouteRule} rule
 * @property {string[]|null} params Regex capture groups (full match stripped)
 * @property {string} pathname
 *
 * @typedef {Object} RouteRule
 * @property {RegExp} [reg] First matching rule wins. Do not use the `g` flag.
 * @property {string} [path] Exact pathname when `reg` is omitted.
 * @property {function(RouteState, RouteState|null, NavigationMethod):
 *   (any|Promise<any>)} [loading]
 *
 * @typedef {Object} RouterOptions
 * @property {'property'} [linkScope] When `property`, only same-origin `/property/` links
 *   are intercepted (except `/property/sitemap`). Omit to intercept every
 *   same-origin path `getInternalPath` can parse.
 * @property {string} [basePath] Deploy folder (`/pure`). Rules match the path
 *   after this prefix. Defaults to `__APP_BASE__` from the webpack publicPath.
 */

import { stripAppBase, withAppBase } from '../../../helpers/htmlPath.js';

/** @returns {string} */
function definedAppBase() {
	return typeof __APP_BASE__ === 'string' ? __APP_BASE__ : '';
}

export class Router {
	/** @type {Router|null} */
	static active = null;

	/**
	 * @param {RouteRule[]} rules First match wins; put specific patterns first.
	 * @param {RouterOptions} [options]
	 */
	constructor(rules, options = {}) {
		if (Router.active && Router.active !== this) {
			Router.active.destroy();
		}
		this.rules = rules;
		this.options = options;
		this.basePath = options.basePath != null ? options.basePath : definedAppBase();
		/** @type {RouteState|null} */
		this.currentRouter = null;
		this._onPopstate = null;
		this._onClick = null;
		this._destroyed = false;
		this._navId = 0;
		this.init();
		Router.active = this;
	}

	/**
	 * Pathname (+ the href's own query, if any) for a same-origin href, or `''` (let the
	 * browser handle it). Keeping the query lets `?index=2` links (pagination) navigate;
	 * an href without one still keeps the current query (see `push`).
	 * @param {string} path
	 * @returns {string}
	 */
	getInternalPath(path) {
		try {
			if (path.indexOf(window.location.origin) === 0 || path.indexOf('/') === 0) {
				const url = new URL(path, window.location.origin);
				return url.pathname + url.search;
			}
		} catch {
			return '';
		}
		return '';
	}

	splitTarget(path) {
		const noHash = path.split('#')[0];
		const queryAt = noHash.indexOf('?');
		if (queryAt === -1) {
			return { pathname: noHash, search: undefined };
		}
		return {
			pathname: noHash.slice(0, queryAt) || '/',
			search: noHash.slice(queryAt),
		};
	}

	/**
	 * Run the matched rule's `loading`, then update history for `push`/`replace`.
	 * `goto` does not touch history — popstate already changed the URL.
	 * @param {RouteState} state
	 * @param {NavigationMethod} method
	 */
	async navigate(state, method) {
		if (!state || this._destroyed) {
			return;
		}
		const navId = ++this._navId;
		try {
			await this.loading(state, method);
			if (this._destroyed || navId !== this._navId) {
				return;
			}
			this.currentRouter = state;
			const browserPath = withAppBase(state.pathname, this.basePath);
			const search = state.search || '';
			const historyUrl = `${browserPath}${search}`;
			state.pathname = browserPath;
			state.search = search;
			if (method === 'push') {
				window.history.pushState({ pathname: browserPath, search }, '', historyUrl);
			} else if (method === 'replace') {
				window.history.replaceState({ pathname: browserPath, search }, null, historyUrl);
			}
		} catch (error) {
			console.error('Navigation error:', error);
		}
	}

	/**
	 * In-app navigation. `loading` runs before `pushState`.
	 * A path with `?` sets the query. A path without `?` keeps the current query.
	 * @param {string} path
	 */
	async push(path) {
		if (this._destroyed) {
			return;
		}
		const target = this.splitTarget(path);
		const search = target.search !== undefined ? target.search : window.location.search || '';
		if (
			this.currentRouter &&
			stripAppBase(this.currentRouter.pathname, this.basePath) ===
				stripAppBase(target.pathname, this.basePath) &&
			(this.currentRouter.search || '') === search
		) {
			return;
		}
		let state = this.routerTo(target.pathname);
		if (!state || this._destroyed) {
			return;
		}
		state.search = search;
		await this.navigate(state, 'push');
	}

	/**
	 * Sync the current URL (boot). `loading` runs while the bar already matches.
	 * @param {string} path
	 */
	async replace(path) {
		if (this._destroyed) {
			return;
		}
		const target = this.splitTarget(path);
		const search = target.search !== undefined ? target.search : window.location.search || '';
		if (
			this.currentRouter &&
			stripAppBase(this.currentRouter.pathname, this.basePath) ===
				stripAppBase(target.pathname, this.basePath) &&
			(this.currentRouter.search || '') === search
		) {
			return;
		}
		let state = this.routerTo(target.pathname);
		if (!state || this._destroyed) {
			return;
		}
		state.search = search;
		await this.navigate(state, 'replace');
	}

	/**
	 * @param {string} internalPath
	 * @param {MouseEvent} [e]
	 * @param {Element} [target]
	 * @returns {boolean} `true` to intercept (preventDefault + push)
	 */
	shouldHandlePropertyLink(internalPath, e, target) {
		if (this.options.linkScope !== 'property') {
			return true;
		}
		const appPath = stripAppBase(internalPath, this.basePath);
		if (!appPath.startsWith('/property/')) {
			return false;
		}
		if (appPath.startsWith('/property/sitemap')) {
			return false;
		}
		if (e && (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey)) {
			return false;
		}
		if (target && target.getAttribute('target') === '_blank') {
			return false;
		}
		if (target && target.hasAttribute('download')) {
			return false;
		}
		return true;
	}

	init() {
		this._onPopstate = (e) => {
			const pathname =
				(e.state && e.state.pathname) || window.location.pathname || '';
			const search = window.location.search || '';
			if (
				this.currentRouter &&
				this.currentRouter.pathname === pathname &&
				(this.currentRouter.search || '') === search
			) {
				return;
			}
			let state = this.routerTo(pathname);
			if (!state) {
				return;
			}
			state.search = search;
			this.navigate(state, 'goto');
		};
		this._onClick = (e) => {
			let target = e.target.tagName === 'A' ? e.target : e.target.closest('a');
			if (target) {
				let href = target.getAttribute('href');

				if (!href) {
					return;
				}

				let internalPath = this.getInternalPath(href);
				if (internalPath === '') {
					return;
				}

				if (!this.shouldHandlePropertyLink(internalPath, e, target)) {
					return;
				}

				e.preventDefault();
				this.push(internalPath);
			}
		};
		window.addEventListener('popstate', this._onPopstate);
		document.addEventListener('click', this._onClick);
		this.replace(window.location.pathname);
	}

	/**
	 * Remove document/window listeners. Safe to call more than once.
	 * Creating a new Router destroys the previous active instance.
	 */
	destroy() {
		if (this._destroyed) {
			return;
		}
		this._destroyed = true;
		if (this._onPopstate) {
			window.removeEventListener('popstate', this._onPopstate);
			this._onPopstate = null;
		}
		if (this._onClick) {
			document.removeEventListener('click', this._onClick);
			this._onClick = null;
		}
		if (Router.active === this) {
			Router.active = null;
		}
	}

	/**
	 * @param {RouteState} to
	 * @param {NavigationMethod} method
	 */
	async loading(to, method) {
		if (to && to.rule && to.rule.loading) {
			await to.rule.loading(to, this.currentRouter, method);
		}
	}

	/**
	 * First matching rule, or full navigation if none match a different URL.
	 * @param {string} pathname
	 * @returns {RouteState|undefined}
	 */
	routerTo(pathname) {
		if (!pathname) {
			return;
		}
		const appPath = stripAppBase(pathname, this.basePath);
		let toRule = null;
		let params = null;
		for (let i = 0; i < this.rules.length; i++) {
			let rule = this.rules[i];
			if (rule.reg instanceof RegExp) {
				if (rule.reg.test(appPath)) {
					toRule = rule;
					params = appPath.match(rule.reg);
					if (params && params.length > 1) {
						params = params.slice(1); // remove the full match
					}
					break;
				}
			} else if (rule.path === appPath) {
				toRule = rule;
				break;
			}
		}
		if (!toRule) {
			if (pathname) {
				//if pathname is not a rule, redirect to the pathname
				if (window.location.pathname === pathname) {
					return;
				}
				window.location.href = pathname;
			} else {
				throw new Error('No rule found for path: ' + pathname);
			}
		}
		const state = {
			rule: toRule,
			params: params || null,
			pathname: pathname,
		};
		return state;
	}
}
