import Fuse from 'fuse.js';
import { geoType } from '../helpers/geo.js';

export function initialFuseState(state) {
	if (globalThis[geoType.state]) {
		return globalThis[geoType.state];
	}
	globalThis[geoType.state] = new Fuse(state, {
		keys: [
			{
				name: 'state',
				weight: 0.5,
			},
			{
				name: 'name',
				weight: 0.5,
			},
		],
		threshold: 0.1,
	});
	return globalThis[geoType.state];
}

export function initialFuseCity(city) {
	if (globalThis[geoType.city]) {
		return globalThis[geoType.city];
	}
	globalThis[geoType.city] = new Fuse(city, {
		keys: ['input'],
		threshold: 0.1,
		includeScore: true,
		ignoreLocation: true,
		findAllMatches: true,
		limit: 10, // Limit to 10 results
	});
	return globalThis[geoType.city];
}

export function initialFuseCounty(county) {
	if (globalThis[geoType.county]) {
		return globalThis[geoType.county];
	}
	globalThis[geoType.county] = new Fuse(county, {
		keys: [
			{
				name: 'input',
				weight: 0.8,
			},
			{
				name: 'county',
				weight: 0.15,
			},
			{
				name: 'state',
				weight: 0.05,
			},
		],
		threshold: 0.3,
		includeScore: true,
		ignoreLocation: true,
		findAllMatches: true,
	});
	return globalThis[geoType.county];
}

export function initialFuseZipcode(zipcode) {
	if (globalThis[geoType.zipcode]) {
		return globalThis[geoType.zipcode];
	}
	globalThis[geoType.zipcode] = new Fuse(zipcode, {
		keys: [
			{
				name: 'input',
				weight: 0.8,
			},
			{
				name: 'zipcode',
				weight: 0.2,
			},
		],
		threshold: 0.3,
		includeScore: true,
		ignoreLocation: true,
		findAllMatches: true,
	});
	return globalThis[geoType.zipcode];
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
		keys: [
			{
				name: 'input',
				weight: 0.6,
			},
			{
				name: 'neighborhood',
				weight: 0.2,
			},
			{
				name: 'city',
				weight: 0.1,
			},
			{
				name: 'state',
				weight: 0.1,
			},
		],
		threshold: 0.3,
		includeScore: true,
		ignoreLocation: true,
		findAllMatches: true,
	});
	return globalThis[geoType.neighborhood];
}

export function initialFuseGeo({ state, city, county, zipcode, address, neighborhood }) {
	if (!globalThis[geoType.state] && state) {
		initialFuseState(state);
	}
	if (!globalThis[geoType.city] && city) {
		initialFuseCity(city);
	}
	if (!globalThis[geoType.zipcode] && zipcode) {
		initialFuseZipcode(zipcode);
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

export function searchGeo(query, type, limit = 10) {
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

		// Apply limit
		return result.slice(0, limit);
	} catch (error) {
		console.error('searchGeo: Unexpected error', error);
		return [];
	}
}
