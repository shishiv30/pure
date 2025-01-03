import useragent from 'express-useragent';
import config from '../configs/index.js';
import BaseFactory from '../factories/basefactory.js';
import { getBreadcrumbByGeo } from '../../helpers/geo.js';
const queryGroupKey = ['utm', 'hack'];

export default class BaseController {
	constructor(req, res, name) {
		if (!req) {
			throw new Error('Req is required');
		}
		if (!res) {
			throw new Error('Res is required');
		}
		this.req = req;
		this.res = res;
		this.name = name;
		this.date = new Date();
		this.config = this.getConfig(name);
		if (!this.config) {
			throw new Error('Model Config is required');
		}
		this.initialReq();
	}

	initialReq() {
		if (this.req.headers['user-agent']) {
			this.req.uaData = useragent.parse(this.req.headers['user-agent']);
		}
		// if (this.req.query) {
		// 	this.req.queryData = this._getQueryData(this.req.query);
		// }
	}

	// _getQueryData(query) {
	// 	if (!query) return null;
	// 	let queryData = {};
	// 	for (const key in query) {
	// 		let groupKey = key.split('_')[0];
	// 		let index = queryGroupKey.indexOf(`${groupKey}`);
	// 		if (index > -1) {
	// 			let subGroupKey = key.split('_')[1];
	// 			if (subGroupKey) {
	// 				if (!queryData[groupKey]) {
	// 					queryData[groupKey] = {};
	// 				}
	// 				queryData[groupKey][subGroupKey] = query[key];
	// 			}
	// 		} else {
	// 			queryData[key] = query[key];
	// 		}
	// 	}
	// 	return queryData;
	// }

	getConfig(name) {
		return config.find((item) => {
			if (item.name === name) {
				return true;
			}
		});
	}

	exceptionDataHandler(error, payload) {
		let message, data, code;
		if (this.config.onError) {
			let result = this.config.onError(error, payload);
			message = result?.message;
			data = result?.data;
			code = result?.code;
		}
		return { error: message || error?.message, data: data || null, code: code || 500 };
	}
	initialMeta(model) {
		//get lang from this.req.headers['accept-language'] with format like en-US
		let lang = this.req.acceptsLanguages();
		return {
			uaData: this.req.uaData,
			lang: (lang && lang[0]) || '',
			path: this.req.path,
		};
	}
	initialBreadcrumb(model) {
		if (model && model.data && model.data.geo) {
			return getBreadcrumbByGeo(model.data.geo);
		} else {
			return null;
		}
	}

	initialSeo(model) {
		if (this.config.seo) {
			return this.config.seo(this.req, model);
		}
		return {
			title: '',
			desc: '',
			keywords: '',
		};
	}

	async post() {
		if (this.config.post) {
			let payload = this.req.body;
			if (this.config.beforePost) {
				payload = this.config.beforePost(this.req, payload);
			}
			try {
				let data = await this.config.post(payload);
				return { code: 200, data: data };
			} catch (error) {
				return this.exceptionDataHandler(error, payload);
			}
		}
	}

	async update() {
		if (this.config.update) {
			let payload = this.req.body;
			if (this.config.beforeUpdate) {
				payload = this.config.beforeUpdate(this.req, payload);
			}
			try {
				let data = await this.config.update(payload);
				return { code: 200, data: data };
			} catch (error) {
				return this.exceptionDataHandler(error, payload);
			}
		}
	}

	async delete() {
		if (this.config.delete) {
			let payload = this.req.body;
			if (this.config.beforeDelete) {
				payload = this.config.beforeDelete(this.req, payload);
			}
			try {
				let data = await this.config.delete(payload);
				return { code: 200, data: data };
			} catch (error) {
				return this.exceptionDataHandler(error, payload);
			}
		}
	}

	async get() {
		let payload = this.req.query;
		if (this.config.beforeGet) {
			payload = this.config.beforeGet(this.req, payload);
		}
		try {
			let data = await this.config.get(payload);
			return { code: 200, data: data };
		} catch (error) {
			return this.exceptionDataHandler(error, payload);
		}
	}

	async toData(result) {
		let code = result.code || 200;
		this.res.status(code).json({
			code: code,
			data: result.data,
			error: result.error,
			cost: new Date() - this.date,
		});
	}
	async toPage(model) {
		if (!this.config.name) {
			throw new Error('View Template is required');
		}
		model.meta = this.initialMeta(model);
		model.seo = this.initialSeo(model);
		model.breadcrumb = this.initialBreadcrumb(model);
		//relative path of ejs template
		this.res.render(`${this.config.name}.ejs`, model);
	}
}
