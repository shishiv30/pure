import { geoType } from '../../helpers/geo.js';

export default {
	name: 'geo',
	get: function (payload) {
		//geo
		return new Promise((resolve, reject) => {
			let { type, text, size } = payload;
			if (!text) {
				resolve([]);
			}
			if (!type) {
				type = geoType.city;
			}
			if (!size) {
				size = 10;
			}
			if (!globalThis[type.toLocaleLowerCase()]) {
				throw new Error(`Invalid type: ${type}`);
			}
			let results = globalThis[type.toLocaleLowerCase()]
				.search(text)
				.slice(0, size)
				.map((e) => e.item);
			resolve(results);
		});
	},
};
