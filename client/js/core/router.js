/**
 * Client SPA router (click + popstate).
 * @see docs/client-js-lifecycle.md (map: client-boot)
 *
 * @typedef {Object} RouterOptions
 * @property {'demo'} [linkScope] When set, only same-origin links under `/demo/` are handled by the router (full navigation for others). Paths starting with `/demo/sitemap` always use full navigation.
 */

export class Router {
	/** @type {Router|null} */
	static active = null;

	/**
	 * @param {Array} rules
	 * @param {RouterOptions} [options]
	 */
	constructor(rules, options = {}) {
		if (Router.active && Router.active !== this) {
			Router.active.destroy();
		}
		this.rules = rules;
		this.options = options;
		this.currentRouter = null;
		this.history = [];
		this._onPopstate = null;
		this._onClick = null;
		this._destroyed = false;
		this.init();
		Router.active = this;
	}

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

	async navigate(state, method) {
		if (!state || this._destroyed) {
			return;
		}
		try {
			let res = await this.loading(state);
			if (this._destroyed) {
				return;
			}
			this.loaded(state, res);
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

	async push(path) {
		if (this._destroyed) {
			return;
		}
		if (this.currentRouter && this.currentRouter.pathname === path) {
			return;
		}
		let state = await this.routerTo(path);
		if (!state || this._destroyed) {
			return;
		}
		await this.navigate(state, 'push');
	}

	async replace(path) {
		if (this._destroyed) {
			return;
		}
		if (this.currentRouter && this.currentRouter.pathname === path) {
			return;
		}
		let state = await this.routerTo(path);
		if (!state || this._destroyed) {
			return;
		}
		await this.navigate(state, 'replace');
	}

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

	async loading(to) {
		if (to && to.rule && to.rule.loading) {
			let res = await to.rule.loading(to, this.currentRouter);
			if (res) {
				return res;
			} else {
				return null;
			}
		}
		return null;
	}

	async loaded(to) {
		if (this.currentRouter && this.currentRouter.destroy) {
			this.currentRouter.destroy(to, this.currentRouter);
		}
	}

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
