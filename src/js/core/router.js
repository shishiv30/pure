export class router {
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
	async replace(path) {
		let router = this.routerTo(path);
		let res = await this.loading(router);
		this.loaded(router, res);
        if(this.history.length === 0){
            this.history.push(router);
        } else {
            this.history[this.history.length - 1] = router;
        }
        this.currentRouter = router;
        window.history.replaceState(null, '', router.pathname);

	}
	async push(path) {
		let router = this.routerTo(path);
		let res = await this.loading(router);
		this.loaded(router, res);
		this.history.push(router);
		this.currentRouter = router;
		window.history.pushState(null, '', router.pathname);
	}
	async back() {
		let router = this.history[this.history.length - 1];
		let res = await this.loading(router);
		this.loaded(router, res);
		this.history.pop();
		this.currentRouter = router;
		window.history.replaceState(null, '', router.pathname);
	}
	goBack() {
		if (this.history.length === 0) {
			return;
		}
		window.history.back();
	}
    goNext(internalPath) {
        if (internalPath !== window.location.pathname) {
            this.push(internalPath);
        } else {
            this.replace(internalPath);
        }
    }
	init() {
		window.addEventListener('popstate', (event) => {
			this.back();
		});
		document.addEventListener('click', (e) => {
			if (e.target.tagName === 'A') {
				let href = e.target.getAttribute('href');

				if (!href) {
					return;
				}

				let internalPath = this.getInternalPath(href);
				if (internalPath === '') {
					return;
				}

				e.preventDefault();
                this.goNext(internalPath);
			}
		});
        this.goNext(window.location.pathname);
	}

	async loading(to) {
		if (to.rule && to.rule.loading) {
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
		for (let i = 0; i < this.rules.length; i++) {
			let rule = this.rules[i];
			if (rule.reg instanceof RegExp) {
				if (rule.reg.test(pathname)) {
					toRule = rule;
					break;
				} else {
                    console.log(`${rule.reg} : ${pathname} `)
                }
			} else if (rule.path === pathname) {
				toRule = rule;
				break;
			}
		}
        if(!toRule){
             throw new Error('No rule found for path: ' + pathname);
        }
		return {
			rule: toRule,
			pathname: pathname,
		};
	}
}
