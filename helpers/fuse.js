import Fuse from 'fuse.js';
import { geoType } from '../helpers/geo.js';

export function initialFuseState(state) {
	globalThis[geoType.state] = new Fuse(state, {
		keys: ['state', 'path'],
		threshold: 0.1,
	});
	return globalThis[geoType.state];
}

export function initialFuseCity(city) {
	if (globalThis[geoType.city]) {
		return globalThis[geoType.city];
	}
	globalThis[geoType.city] = new Fuse(city, {
		keys: ['city'],
		threshold: 0.1,
	});
	return globalThis[geoType.city];
}

export function initialFuseCounty(county) {
	if (globalThis[geoType.county]) {
		return globalThis[geoType.county];
	}
	globalThis[geoType.county] = new Fuse(county, {
		keys: ['county'],
		threshold: 0.1,
	});
	return globalThis[geoType.county];
}

export function initialFuseZip(zip) {
	if (globalThis[geoType.zip]) {
		return globalThis[geoType.zip];
	}
	globalThis[geoType.zip] = new Fuse(zip, {
		keys: ['zip'],
		threshold: 0.1,
	});
	return globalThis[geoType.zip];
}

export function initialFuseAddress(address) {
	if (globalThis[geoType.address]) {
		return globalThis[geoType.address];
	}
	globalThis[geoType.address] = new Fuse(address, {
		keys: ['address'],
		threshold: 0.1,
	});
	return globalThis[geoType.address];
}

export function initialFuseNeighborhood(neighborhood) {
	if (globalThis[geoType.neighborhood]) {
		return globalThis[geoType.neighborhood];
	}
	globalThis[geoType.neighborhood] = new Fuse(neighborhood, {
		keys: ['neighborhoodFull'],
		threshold: 0.1,
	});
	return globalThis[geoType.neighborhood];
}

export function initialFuseGeo({ state, city, county, zip, address, neighborhood }) {
	if (!globalThis[geoType.state] && state) {
		initialFuseState(state);
	}
	if (!globalThis[geoType.city] && city) {
		initialFuseCity(city);
	}
	if (!globalThis[geoType.zip] && zip) {
		initialFuseZip(zip);
	}
	if (!globalThis[geoType.county] && county) {
		initialFuseCounty(county);
	}
	if (!globalThis[geoType.neighborhood] && neighborhood) {
		initialFuseNeighborhood(neighborhood);
	}
	// if (!globalThis[geoType.address] && address) {
	// 	initialFuseAddress(address);
	// }
}

export function searchGeo(query, type) {
	try {
		// Validate inputs
		if (!query || typeof query !== 'string') {
			console.warn('searchGeo: Invalid query parameter');
			return [];
		}
		if (!type || !Object.values(geoType).includes(type)) {
			console.warn('searchGeo: Invalid type parameter');
			return [];
		}

		let result = [];
		const fuseInstance = globalThis[type];

		// Check if Fuse instance exists
		if (!fuseInstance) {
			console.warn(`searchGeo: No Fuse instance found for type ${type}`);
			return [];
		}

		// Perform search
		try {
			result = fuseInstance.search(query);
		} catch (searchError) {
			console.error('searchGeo: Search operation failed', searchError);
			return [];
		}

		return result;
	} catch (error) {
		console.error('searchGeo: Unexpected error', error);
		return [];
	}
}
