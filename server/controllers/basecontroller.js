import useragent from 'express-useragent';
import config from '../configs/index.js';
import BaseFactory from '../factories/basefactory.js';
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

	loadModel(name, data) {
		if (name === 'geo') {
			this.model = new GeoModel(this.req, this.res, data);
		}
	}

	async post() {
		if (this.config.post) {
			let data = this.req.body;
			if (this.config.postData) {
				data = this.config.postData(this.req);
			}
			try {
				this.res.data = await this.config.post(data);
			} catch (error) {
				this.res.data = this.exceptionDataHandler(error);
			}
		}
	}

	async update() {
		if (this.config.update) {
			let data = this.req.body;
			if (this.config.updateData) {
				data = this.config.updateData(this.req);
			}
			try {
				this.res.data = await this.config.update(data);
			} catch (error) {
				this.res.data = this.exceptionDataHandler(error);
			}
		}
	}

	async delete() {
		if (this.config.delete) {
			let data = this.req.body;
			if (this.config.deleteData) {
				data = this.config.deleteData(this.req);
			}
			this.res.data = await this.config.delete(data);
			try {
				this.res.data = await this.config.delete(data);
			} catch (error) {
				this.res.data = this.exceptionDataHandler(error);
			}
		}
	}

	async get() {
		let data = this.req.query;
		if (this.config.getData) {
			data = this.config.getData(this.req);
		}
		try {
			this.res.data = await this.config.get(data);
		} catch (error) {
			this.res.data = this.exceptionDataHandler(error);
		}
		return this.res.data;
	}

	async loading() {
		let factory = new BaseFactory(this.req, this.res, this.name);
		this.data = await factory.loading();
	}
	async sendApi(data) {
		let code = data.code || 200;
		this.res.status(code).json({
			code: code,
			data: data,
			cost: new Date() - this.date,
		});
	}
	// async toPage(req, res) {

	// 	this.model.filter = this._toServerFilter(req);
	// 	let data = await this.get(this.model.filter);
	// 	//use model.ejs URl + model.pageData to render view
	// 	res.render(view, data);
	// }
}
