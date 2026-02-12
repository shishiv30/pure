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
import demoSitemap from './demoSitemap.js';
import demoSitemapState from './demoSitemapState.js';
import demoSitemapCounty from './demoSitemapCounty.js';
import demoSitemapCity from './demoSitemapCity.js';
import indexPage from './indexPage.js';
import pageConfig from './page.js';
export default [geo, demo, demoSitemap, demoSitemapState, demoSitemapCounty, demoSitemapCity, indexPage, pageConfig];
