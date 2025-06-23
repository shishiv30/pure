import { getGeoByPath, getGeoDisplayText } from '../../helpers/geo.js';
import geoConfig from './geo.js';
import articles from '../../data/mock/articles.js';
import { getGeoCityByIp } from '../../helpers/ip.js';
import { mapGeoToSOAPath } from '../../helpers/geo.js';
import { mapPropertiesToArticles } from '../../helpers/propertyMapper.js';
import config from '../config.js';

// Reusable function for fetching properties from SOA API
export async function fetchPropertiesFromSOA(soaPath) {
	try {
		if (!soaPath) {
			throw new Error('Path is required');
		}

		const response = await fetch(`${config.soaApiDomain}/widget/api/nearbyhomes/${soaPath}`);

		if (!response.ok) {
			throw new Error(`SOA API request failed: ${response.status} ${response.statusText}`);
		}

		const result = await response.json();

		if (!result.data || !result.data.listings) {
			throw new Error('Invalid response from SOA API');
		}
		return result.data.listings || [];
	} catch (error) {
		console.error('Error fetching properties:', error);
		return [];
	}
}

export default {
	name: 'demo',
	beforeGet: function (req, payload) {
		let geo;
		if (req.query.path) {
			geo = getGeoByPath(req.query.path);
		} else if (req.query.ip || req.ip) {
			let ip = req.query.ip || req.ip;
			geo = getGeoCityByIp(ip);
		}

		if (geo) {
			let text = geo[geo.type];
			if (geo.type === 'neighborhood' && geo.state) {
				text = `${text}, ${geo.state}`;
			}
			return {
				type: geo.type,
				text: text,
				size: 1,
			};
		}
		return null;
	},
	preload: function (req, model) {
		let preload = null;
		if (model?.data?.articles?.length > 0) {
			preload = [
				{
					as: 'image',
					href: model.data.articles[0].img,
				},
			];
		}
		return preload;
	},
	get: async function (payload) {
		let geo = null;
		let articles = [];
		if (payload && payload.text && payload.type) {
			if (payload.type === 'ip') {
				let geo = await getGeoCityByIp(payload.text);
				if (geo) {
					return geo;
				}
			}
			try {
				let res = await geoConfig.get(payload);
				if (res?.length > 0) {
					geo = res[0];
				}
			} catch (error) {
				geo = null;
			}
		}
		//use api to fetch properties
		if (geo) {
			let soaPath = mapGeoToSOAPath(geo);
			let properties = await fetchPropertiesFromSOA(soaPath);
			articles = mapPropertiesToArticles(properties);
		}
		let model = {
			geo: geo,
			articles: articles,
		};

		return model;
	},
};

// document.addEventListener("DOMContentLoaded", () => {
//   const body = document.body;
//   let timer = null;
//   // Apply initial 3D styles dynamically
//   body.style.cssText = `
//     perspective: 1000px;
//     transform-style: preserve-3d;
//   `;

//   // Mouse movement effect with max ±75° rotateY
//   document.addEventListener("mousemove", (e) => {
//     const halfWidth = window.innerWidth / 2;
//     const halfHeight = window.innerHeight / 2;
//     const x = ((e.clientX - halfWidth) / halfWidth) * 30; // Max ±75°
//     const y = ((halfHeight - e.clientY) / halfHeight) * 40; // Max ±40°
//     if(timer) clearTimeout(timer);
//     timer = requestAnimationFrame(() => {
//       body.style.transition = "transform 0.1s linear";
//       body.style.transform = `rotateX(${y}deg) rotateY(${x}deg) translateZ(-100px)`;
//     });
//   });
// });
