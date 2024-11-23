import BaseResponseModel from '../models/baseresponsemodel.js';
export default class BaseFactory {
	constructor(req, res, name) {
		if (!name) {
			throw new Error('Model Config Name is required');
		}
		this.config = this.getConfig(name);
		this.model = new BaseResponseModel(req, res, this.config);
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
	}

	exceptionDataHandler(error) {
		if (this.config.exceptionData) {
			let customError = this.config.onError(error);
			if (customError) {
				return customError;
			}
		}
		return error;
	}

	getConfig(name) {
		if (name === 'geo') {
			return new BaseResponseModel(this.req, this.res);
		}
	}
}
