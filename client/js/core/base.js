import { logError } from './log.js';
export class Base {
	constructor(name, type) {
		if (!name) {
			logError(`"name" of ${type} is required`);
			return;
		}
		this.name = name;
		this.type = type || 'base';
	}
}