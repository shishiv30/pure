import BaseModel from './basemodel.js';
export default class BaseResponseModel extends BaseModel {
	constructor(req, res, config) {
		if (!req) {
			throw new Error('Req is required');
		}
		if (!res) {
			throw new Error('Res is required');
		}
		if (!config) {
			throw new Error('Model Config is required');
		}
		super({ name: config.name || 'BaseResponseModel' });
		this.req = req;
		this.res = res;
	}
}
