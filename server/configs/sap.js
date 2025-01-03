import { getGeoByPath } from '../../helpers/geo.js';
import geoConfig from './geo.js';
export default {
	name: 'sap',
	beforeGet: function (req, payload) {
		let geo = getGeoByPath(req.query.path);
		if (geo) {
			return {
				type: geo.type,
				text: geo[geo.type],
				size: 1,
			};
			return null;
		}
	},
	get: async function (payload) {
		let geo = null;
		if (payload && payload.text && payload.type) {
			try {
				let res = await geoConfig.get(payload);
				if (res?.length > 0) {
					geo = res[0];
				}
			} catch (error) {
				geo = null;
			}
		}

		return {
			geo: geo,
		};
	},
};
