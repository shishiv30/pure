import useragent from 'express-useragent';
import config from '../configs/index.js';
import serverConfig from '../config.js';
import { getBreadcrumbByGeo } from '../../helpers/geo.js';
import fs from 'fs';
import mime from 'mime';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const queryGroupKey = ['utm', 'hack'];

export default class BaseController {
	constructor(req, res, name) {
		if (!req) {
			throw new Error('Req is required');
		}
		if (!res) {
			throw new Error('Res is required');
		}
		this.req = req;
		this.res = res;
		this.name = name;
		this.date = new Date();
		this.config = this.getConfig(name);
		if (!this.config) {
			throw new Error('Model Config is required');
		}
		this.initialReq();
	}

	initialReq() {
		if (this.req.headers['user-agent']) {
			this.req.uaData = useragent.parse(this.req.headers['user-agent']);
		}
		// if (this.req.query) {
		// 	this.req.queryData = this._getQueryData(this.req.query);
		// }
	}

	// _getQueryData(query) {
	// 	if (!query) return null;
	// 	let queryData = {};
	// 	for (const key in query) {
	// 		let groupKey = key.split('_')[0];
	// 		let index = queryGroupKey.indexOf(`${groupKey}`);
	// 		if (index > -1) {
	// 			let subGroupKey = key.split('_')[1];
	// 			if (subGroupKey) {
	// 				if (!queryData[groupKey]) {
	// 					queryData[groupKey] = {};
	// 				}
	// 				queryData[groupKey][subGroupKey] = query[key];
	// 			}
	// 		} else {
	// 			queryData[key] = query[key];
	// 		}
	// 	}
	// 	return queryData;
	// }

	getConfig(name) {
		return config.find((item) => {
			if (item.name === name) {
				return true;
			}
		});
	}

	exceptionDataHandler(error, payload) {
		let message, data, code;
		if (this.config.onError) {
			let result = this.config.onError(error, payload);
			message = result?.message;
			data = result?.data;
			code = result?.code;
		}
		return { error: message || error?.message, data: data || null, code: code || 500 };
	}
	initialMeta(model) {
		//get lang from this.req.headers['accept-language'] with format like en-US
		let lang = this.req.acceptsLanguages();
		let origin = this.req.headers.origin || `${this.req.protocol}://${this.req.get('host')}`;
		// Use CDN URL if configured, otherwise use relative paths
		const cdnBase = serverConfig.cdnUrl && serverConfig.cdnUrl !== serverConfig.appUrl
			? `${serverConfig.cdnUrl.replace(/\/$/, '')}`
			: '';
		const assetPath = (path) => cdnBase ? `${cdnBase}${path}` : path;
		let preload = [
			{
				as: 'image',
				href: assetPath('/img.logo-bg.svg'),
			},
		];
		if (this.config.preload) {
			let pagePreload = this.config.preload(this.req, model);
			if (pagePreload) {
				preload = preload.concat(pagePreload);
			}
		}
		const assetName = this.config.assetName || this.config.name;
		let meta = {
			uaData: this.req.uaData,
			lang: (lang && lang[0]) || '',
			path: this.req.path,
			origin: origin,
			preload: preload,
			css: assetPath(`/${assetName}.min.css`),
			js: assetPath(`/${assetName}.min.js`),
			pageType: `page-${this.config.name}`,
			cdnUrl: cdnBase,
			appUrl: serverConfig.appUrl,
			appName: serverConfig.appName,
		};
		// Add theme overrides if provided in model
		if (model?.theme) {
			meta.theme = model.theme;
		}
		return meta;
	}
	initialBreadcrumb(model) {
		if (model?.data?.breadcrumb) {
			return model.data.breadcrumb;
		}
		if (model?.data?.geo) {
			return getBreadcrumbByGeo(model.data.geo, `/${this.config.name}`);
		}
		return null;
	}

	initialSeo(model) {
		if (this.config.seo) {
			return this.config.seo(this.req, model);
		}
		return {
			title: '',
			desc: '',
			keywords: '',
		};
	}

	async post() {
		if (this.config.post) {
			let payload = this.req.body;
			if (this.config.beforePost) {
				payload = this.config.beforePost(this.req, payload);
			}
			try {
				let data = await this.config.post(payload);
				return { code: 200, data: data };
			} catch (error) {
				return this.exceptionDataHandler(error, payload);
			}
		}
	}

	async update() {
		if (this.config.update) {
			let payload = this.req.body;
			if (this.config.beforeUpdate) {
				payload = this.config.beforeUpdate(this.req, payload);
			}
			try {
				let data = await this.config.update(payload);
				return { code: 200, data: data };
			} catch (error) {
				return this.exceptionDataHandler(error, payload);
			}
		}
	}

	async delete() {
		if (this.config.delete) {
			let payload = this.req.body;
			if (this.config.beforeDelete) {
				payload = this.config.beforeDelete(this.req, payload);
			}
			try {
				let data = await this.config.delete(payload);
				return { code: 200, data: data };
			} catch (error) {
				return this.exceptionDataHandler(error, payload);
			}
		}
	}

	async get() {
		let payload = this.req.query;
		if (this.config.beforeGet) {
			payload = this.config.beforeGet(this.req, payload);
		}
		try {
			let data = await this.config.get(payload);
			return { code: 200, data: data };
		} catch (error) {
			return this.exceptionDataHandler(error, payload);
		}
	}

	async toData(result) {
		let code = result.code || 200;
		this.res.status(code).json({
			code: code,
			data: result.data,
			error: result.error,
			cost: new Date() - this.date,
		});
	}
	async toPage(model) {
		if (!this.config.name) {
			throw new Error('View Template is required');
		}
		model.meta = this.initialMeta(model);
		model.seo = this.initialSeo(model);
		model.breadcrumb = this.initialBreadcrumb(model);
		//relative path of ejs template
		this.res.render(`${this.config.name}.ejs`, model);
	}

	static async dist(res, fileName) {
		//get file from dist folder
		try {
			const filePath = path.resolve(__dirname, '../../dist', fileName);
			let extName = path.extname(filePath);
			let contentType = mime.getType(extName) || 'application/octet-stream';
			fs.readFile(filePath, 'utf8', (err, data) => {
				if (err) {
					res.status(500).send('Error loading file');
				} else {
					res.setHeader('Content-Type', contentType);
					res.send(data);
				}
			});
		} catch (error) {
			res.status(500).send('Error loading file');
		}
	}
}
