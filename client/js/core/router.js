export class Router {
	constructor(rules) {
		this.rules = rules;
		this.currentRouter = null;
		this.history = [];
		this.init();
	}
	getInternalPath(path) {
		//is internal link
		if (path.indexOf(window.location.origin) === 0) {
			return new URL(path).pathname;
		} else if (path.indexOf('/') === 0) {
			return new URL(path, window.location.origin).pathname;
		} else {
			return '';
		}
	}
	async navigate(state, method) {
		try {
			let res = await this.loading(state);
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
		if (this.currentRouter && this.currentRouter.pathname === path) {
			return;
		}
		let state = await this.routerTo(path);
		await this.navigate(state, 'push');
	}
	async replace(path) {
		if (this.currentRouter && this.currentRouter.pathname === path) {
			return;
		}
		let state = await this.routerTo(path);
		await this.navigate(state, 'replace');
	}
	init() {
		//on popstate check if it back or forward
		window.addEventListener('popstate', (e) => {
			if (
				this.currentRouter &&
				e.state &&
				e.state.pathname &&
				this.currentRouter.pathname === e.state.pathname
			) {
				return;
			}
			let state = this.routerTo(e.state.pathname);
			this.navigate(state, 'goto');
			e.preventDefault();
		});
		document.addEventListener('click', (e) => {
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

				e.preventDefault();
				this.push(internalPath);
			}
		});
		this.replace(window.location.pathname);
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
				} else {
					console.log(`${rule.reg} : ${pathname} `);
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
		// if (method === 'push') {
		// 	state.index = this.history.length;
		// 	this.history.push(state);
		// } else if (method === 'replace') {
		// 	if (this.history.length >0) {
		// 		state.index = this.history.length -1;
		// 		this.history[this.history.length - 1] = state;
		// 	} else {
		// 		state.index = 0;
		// 		this.history.push(state);
		// 	}
		// } else if (method === 'goto') {
		// 	if(this.history.length > 0){
		// 		for(let i = this.history.length - 1; i > 0; i--){
		// 			if(this.history[i].pathname === state.pathname){
		// 				state.index = this.history[i].index;
		// 				break;
		// 			}
		// 		}
		// 		if(state.index > this.currentRouter.index){
		// 			//forward

		// 		} else if (state.index < this.currentRouter.index) {
		// 			//back
		// 		}

		// 	} else {
		// 		state.index = 0;
		// 		this.history.push(state);
		// 	}
		// }
		//get a index of the object
		return state;
	}
}
