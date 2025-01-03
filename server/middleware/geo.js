import { initialGeoData } from '../../data/index.js';
import { initialFuseGeo } from '../../helpers/fuse.js';
export default async function (app) {
	new Promise((resolve, reject) => {
		initialGeoData()
			.then((data) => {
				initialFuseGeo({
					state: data.state,
					city: data.city,
					county: data.county,
					zip: data.zip,
					// address: data.address,
					neighborhood: data.neighborhood,
				});
				console.log('init fuse geo');
				resolve(true);
			})
			.catch((err) => {
				console.error('Error init fuse geo:', err);
				resolve(false);
			});
	});
}
