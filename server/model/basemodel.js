export default class BaseModel {
	constructor(data) {
		if(!data) {
			throw new Error('Model is required');
		}
		if(!data.name) {
			throw new Error('Model Name is required');
		}
		this.name = data.name;
		this.date = new Date();
	}
}
