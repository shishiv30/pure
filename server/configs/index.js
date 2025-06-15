// each item could include as follow
// {
// 	beforeGet(req){
// 		//return data for get method
// 		return this.req.query;
// 	},
// 	get(data){
// 		//data is from beforeGet, if no beforeGet, data is from req.query
// 		return new Promise();
// 	},
// 	beforePost(req){
// 		//return data for post method
// 		return this.req.body;
// 	},
// 	post(data){
// 		//data is from beforePost, if no beforePost, data is from req.body
// 		return new Promise();
// 	},
// }
import geo from './geo.js';
import demo from './demo.js';
export default [geo, demo];
