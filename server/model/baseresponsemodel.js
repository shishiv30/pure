import BaseModel from './basemodel';
import useragent from 'useragent';
const queryGroupKey = ['utm', 'hack'];
export default class BaseResponseModel extends BaseModel {
	constructor(req, res, config) {
		if(!req) {
			throw new Error('Req is required');
		}
		if(!res) {
			throw new Error('Res is required');
		}
		if(!config) {
			throw new Error('Model Config is required');
		}
		super({ name: config.name || 'BaseResponseModel' });
		this.req = req;
		this.res = res;
		this.initialReq(req);
	}
	initialReq() {
		if(this.req.headers['user-agent']) {
			this.req.uaData = useragent.parse(this.req.headers['user-agent']);
		}
		if (this.req.query) {
			this.req.queryData = this._getQueryData(this.req.query);
		}
	}

	_getQueryData(query) {
		if (!query) return null;
		let queryData = {};
		for (const key in query) {
			let groupKey = key.split('_')[0];
			let index = queryGroupKey.indexOf(`${groupKey}`);
			if (index > -1) {
				let subGroupKey = key.split('_')[1];
				if (subGroupKey) {
					if (!queryData[groupKey]) {
						queryData[groupKey] = {};
					}
					queryData[groupKey][subGroupKey] = query[key];
				}
			} else {
				data[key] = query[key];
			}
		}
		return queryData;
	}

	createDataHandler(data) {
		return data;
	}

	updateDataHandler(data) {
		return data;
	}

	deleteDataHandler(data) {
		return data;
	}

	getDataHandler(data) {
		return data;
	}

	exceptionDataHandler(error) {
		if(this.config.exceptionData){
			let customError = this.config.onError(error);
			if(customError){
				return customError;
			}
		}
		return error;
	}

	initalSeoData(data) {
		if(this.config.seo){
			this.res.data.seo = this.config.seo(this.req);
		}
		return data;
	}

	async create() {
		if(this.config.create){
			let data = this.req.bodyData;
			if(this.config.createData){
				data = this.config.createData(this.req);
			}
			try {
				this.res.data = await this.config.create(data);
			} catch (error) {
				this.res.data = this.exceptionDataHandler(error);
			}
		}
    }

    async update() {
        if(this.config.update){
			let data = this.req.bodyData;
			if(this.config.updateData){
				data = this.config.updateData(this.req);
			}
			try{
				this.res.data = await this.config.update(data);
			} catch (error) {
				this.res.data = this.exceptionDataHandler(error);
			}
		}
    }

    async delete() {
        if(this.config.delete){
			let data = this.req.bodyData;
			if(this.config.deleteData){
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
		let data = this.req.bodyData;
		if(this.config.getData){
			data = this.config.getData(this.req);
		}
		try {
			this.res.data = await this.config.get(data);
		} catch (error) {
			this.res.data = this.exceptionDataHandler(error);
		}
    }

	toPage() {
		this.get();
		this.res.data = this.initalSeoData(this.res.data);
		this.res.render(this.config.view, this.res.data);
	}

	toData(){
		this.get();
		this.res.json(this.res.data);
	}
}
