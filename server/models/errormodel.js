import BaseModel from './basemodel';
export default class ErrorModel extends BaseModel {
	constructor(data) {
		super({ name: 'ErrorModel' });
		this.error = data.error;
		this.code = data.code;
	}
}
