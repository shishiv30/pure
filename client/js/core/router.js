/**
 * Client SPA router (click + popstate).
 *
 * Boot: `init()` listens for click/popstate, then `replace(location.pathname)`.
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
 * @property {'demo'} [linkScope] When `demo`, only same-origin `/demo/` links
 *   are intercepted (except `/demo/sitemap`). Omit to intercept every
 *   same-origin path `getInternalPath` can parse.
 */

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
		/** @type {RouteState|null} */
		this.currentRouter = null;
		this._onPopstate = null;
		this._onClick = null;
		this._destroyed = false;
		this.init();
		Router.active = this;
	}

	/**
	 * Pathname for a same-origin href, or `''` (let the browser handle it).
	 * @param {string} path
	 * @returns {string}
	 */
	getInternalPath(path) {
		try {
			if (path.indexOf(window.location.origin) === 0) {
				return new URL(path).pathname;
			}
			if (path.indexOf('/') === 0) {
				return new URL(path, window.location.origin).pathname;
			}
		} catch {
			return '';
		}
		return '';
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
		try {
			await this.loading(state, method);
			if (this._destroyed) {
				return;
			}
			this.currentRouter = state;
			if (method === 'push') {
				window.history.pushState({ pathname: state.pathname }, '', state.pathname);
			} else if (method === 'replace') {
				window.history.replaceState({ pathname: state.pathname }, null, state.pathname);
			}
		} catch (error) {
			console.error('Navigation error:', error);
		}
	}

	/**
	 * In-app navigation. `loading` runs before `pushState`.
	 * @param {string} path
	 */
	async push(path) {
		if (this._destroyed) {
			return;
		}
		if (this.currentRouter && this.currentRouter.pathname === path) {
			return;
		}
		let state = this.routerTo(path);
		if (!state || this._destroyed) {
			return;
		}
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
		if (this.currentRouter && this.currentRouter.pathname === path) {
			return;
		}
		let state = this.routerTo(path);
		if (!state || this._destroyed) {
			return;
		}
		await this.navigate(state, 'replace');
	}

	/**
	 * @param {string} internalPath
	 * @param {MouseEvent} [e]
	 * @param {Element} [target]
	 * @returns {boolean} `true` to intercept (preventDefault + push)
	 */
	shouldHandleDemoLink(internalPath, e, target) {
		if (this.options.linkScope !== 'demo') {
			return true;
		}
		if (!internalPath.startsWith('/demo/')) {
			return false;
		}
		if (internalPath.startsWith('/demo/sitemap')) {
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
			if (
				this.currentRouter &&
				e.state &&
				e.state.pathname &&
				this.currentRouter.pathname === e.state.pathname
			) {
				return;
			}
			let state = this.routerTo(pathname);
			if (!state) {
				return;
			}
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

				if (!this.shouldHandleDemoLink(internalPath, e, target)) {
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
		let toRule = null;
		let params = null;
		for (let i = 0; i < this.rules.length; i++) {
			let rule = this.rules[i];
			if (rule.reg instanceof RegExp) {
				if (rule.reg.test(pathname)) {
					toRule = rule;
					params = pathname.match(rule.reg);
					if (params && params.length > 1) {
						params = params.slice(1); // remove the full match
					}
					break;
				}
			} else if (rule.path === pathname) {
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
