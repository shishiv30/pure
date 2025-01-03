import { geoType } from '../../helpers/geo.js';
// each item could include as follow
// {
// 	getData(req){
// 		//return data for get method
// 		return this.req.query;
// 	},
// 	get(data){
// 		//data is from getData, if no getData, data is from req.query
// 		return new Promise();
// 	},
// 	postData(req){
// 		//return data for post method
// 		return this.req.body;
// 	},
// 	post(data){
// 		//data is from postData, if no postData, data is from req.body
// 		return new Promise();
// 	},
// }

export default [
	{
		name: 'geo',
		get: function (data) {
			//geo
			return new Promise((resolve, reject) => {
				let { type, text, size } = data;
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
	},
];
