import { initialGeoData } from '../../data/index.js';
import { initialFuseGeo } from '../../helpers/fuse.js';
import { geoType } from '../../helpers/geo.js';

export default async function (app) {
	try {
		// Check if Fuse instances are already initialized (from previous nodemon restart)
		const allInitialized =
			globalThis[geoType.state] &&
			globalThis[geoType.city] &&
			globalThis[geoType.county] &&
			globalThis[geoType.zipcode] &&
			globalThis[geoType.neighborhood];

		if (allInitialized) {
			console.log('Fuse geo instances already initialized, skipping...');
			return;
		}

		let data = await initialGeoData();
		if (!data) {
			console.error('Error initializing geo data');
			return;
		}
		initialFuseGeo({
			state: data.state,
			city: data.city,
			county: data.county,
			zipcode: data.zipcode,
			// address: data.address,
			neighborhood: data.neighborhood,
		});
		console.log('init fuse geo');
	} catch (err) {
		console.error('Error init fuse geo:', err);
	}
}
