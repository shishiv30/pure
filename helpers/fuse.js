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
		keys: ['neighborhood'],
		threshold: 0.1,
	});
	return globalThis[geoType.neighborhood];
}

export function initialFuseGeo({ state, city, county, zip, address, neighborhood }) {
	if (!globalThis[geoType.state]) {
		initialFuseState(state);
	}
	if (!globalThis[geoType.city]) {
		initialFuseCity(city);
	}
	if (!globalThis[geoType.zip]) {
		initialFuseZip(zip);
	}
	if (!globalThis[geoType.county]) {
		initialFuseCounty(county);
	}
	if (!globalThis[geoType.neighborhood]) {
		initialFuseNeighborhood(neighborhood);
	}
	if (!globalThis[geoType.address]) {
		initialFuseAddress(address);
	}
}

export function searchGeo(query, type) {
	let result = [];
	switch (type) {
		case geoType.state:
			result = globalThis.STATE.search(query);
			break;
		case geoType.city:
			result = globalThis[geoType.city].search(query);
			break;
		case geoType.county:
			result = globalThis[geoType.county].search(query);
			break;
		case geoType.zip:
			result = globalThis[geoType.zip].search(query);
			break;
		case 'neighborhood':
			result = globalThis[geoType.neighborhood].search(query);
			break;
		default:
			result = globalThis[geoType.city].search(query);
			break;
	}
	return result;
}
