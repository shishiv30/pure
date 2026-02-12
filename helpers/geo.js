import { isValidStateCode, getAllStateCodes, getStateFullName } from './stateDict.js';

export const geoType = {
	state: 'state',
	city: 'city',
	county: 'county',
	zipcode: 'zipcode',
	address: 'address',
	neighborhood: 'neighborhood',
};

export function getGeoCityByCityState(city, state) {
	let cityPath = getCityPath(city, state);
	if (cityPath) {
		return getGeoByPath(cityPath);
	}
	return null;
}

export function getBreadcrumbByGeo(geo, _path) {
	let path = _path || '';
	let data = [
		{
			text: 'Home',
			href: path,
		},
	];

	if (geo) {
		if (geo.state) {
			data.push({
				text: geo.state,
				href: `${path}/${getStatePath(geo.state)}`,
			});
		}
		if (geo.county) {
			data.push({
				text: geo.county,
				href: `${path}/${getCountyPath(geo.county, geo.state)}`,
			});
		}
		if (geo.city) {
			data.push({
				text: geo.city,
				href: `${path}/${getCityPath(geo.city, geo.state)}`,
			});
		}
		if (geo.neighborhood) {
			data.push({
				text: geo.neighborhood,
				href: `${path}/${getNeighborhoodPath(geo.neighborhood, geo.city, geo.state)}`,
			});
		}
		if (geo.zipcode) {
			data.push({
				text: geo.zipcode,
				href: `${path}/${getZipcodePath(geo.zipcode, geo.state)}`,
			});
		}
	}
	return {
		links: data,
	};
}

export function getGeoByPath(_path) {
	let path = _path.replace(/^\//, '').replace(/\/$/, '');
	let segments = path.split('/');
	let geo = {};
	if (isValidStateCode(segments[0])) {
		geo.state = segments[0];
	} else {
		return null;
	}

	if (!segments[1]) {
		geo.type = geoType.state;
		return geo;
	}

	if (segments[1].endsWith('_county')) {
		geo.type = geoType.county;
		// Remove _county from the end of the string and convert hyphens to spaces
		geo.county = segments[1].replace(/_county$/i, '').replace(/-/g, ' ');
		return geo;
	} else if (segments[1].match(/^\d{5}$/)) {
		geo.type = geoType.zipcode;
		geo.zipcode = segments[1];
		return geo;
	}

	// For city names, convert hyphens to spaces
	geo.city = segments[1].replace(/-/g, ' ');

	if (!segments[2]) {
		geo.type = geoType.city;
		return geo;
	}

	if (segments[2].endsWith('_address')) {
		geo.type = geoType.address;
		geo.address = segments[2].replace(/_address$/i, '').replace(/-/g, ' ');
		return geo;
	} else if (segments[2].endsWith('_neighborhood')) {
		geo.type = geoType.neighborhood;
		geo.neighborhood = segments[2].replace(/_neighborhood$/i, '').replace(/-/g, ' ');
		return geo;
	}

	geo.type = geoType.city;
	return geo;
}

export function getStatePath(state) {
	let stateCode = state.toLowerCase();
	return stateCode;
}

export function getCityPath(city, state) {
	let stateCode = state.toLowerCase();
	// Remove "City" suffix if present and trim whitespace
	let cityName = city.replace(/\s+city$/i, '').trim();
	let cityCode = cityName.toLowerCase().replace(/\s+/g, '-');
	return `${stateCode}/${cityCode}`;
}

export function getCountyPath(county, state) {
	let stateCode = state.toLowerCase();
	// Remove "County" suffix if present and trim whitespace
	let countyName = county.replace(/\s+county$/i, '').trim();
	let countyCode = countyName.toLowerCase().replace(/\s+/g, '-');
	return `${stateCode}/${countyCode}_county`;
}

export function getZipcodePath(zipcode, state) {
	let stateCode = state.toLowerCase();
	return `${stateCode}/${zipcode}`;
}

export function getAddressPath(address, city, state) {
	let stateCode = state.toLowerCase();
	// Remove "City" suffix if present for city
	let cityName = city.replace(/\s+city$/i, '').trim();
	let cityCode = cityName.toLowerCase().replace(/\s+/g, '-');
	let addressCode = address.toLowerCase().replace(/\s+/g, '-');
	return `${stateCode}/${cityCode}/${addressCode}_address`;
}

export function getNeighborhoodPath(neighborhood, city, state) {
	let stateCode = state.toLowerCase();
	// Remove "City" suffix if present for city
	let cityName = city.replace(/\s+city$/i, '').trim();
	let cityCode = cityName.toLowerCase().replace(/\s+/g, '-');
	let neighborhoodCode = neighborhood.toLowerCase().replace(/\s+/g, '-');
	return `${stateCode}/${cityCode}/${neighborhoodCode}_neighborhood`;
}

export function getGeoDisplayText(geo) {
	if (!geo) {
		return '';
	}

	if (geo.address) {
		return `${geo.address} ${geo.city}, ${geo.state} ${geo.zipcode}`;
	} else if (geo.neighborhood) {
		if (geo.city.includes(geo.neighborhood)) {
			return `${geo.neighborhood}, ${geo.state}`;
		}
		return `${geo.neighborhood} ${geo.city}, ${geo.state}`;
	} else if (geo.city) {
		return `${geo.city}, ${geo.state}`;
	} else if (geo.county) {
		return `${geo.county}, ${geo.state}`;
	} else if (geo.zipcode) {
		return `${geo.zipcode} ${geo.state}`;
	} else if (geo.state) {
		return `${geo.state}`;
	}

	return '';
}

export function getPathByGeo(geo) {
	if (geo.type === geoType.state) {
		return getStatePath(geo.state);
	} else if (geo.type === geoType.city) {
		return getCityPath(geo.city, geo.state);
	} else if (geo.type === geoType.county) {
		return getCountyPath(geo.county, geo.state);
	} else if (geo.type === geoType.zipcode) {
		return getZipcodePath(geo.zipcode, geo.state);
	} else if (geo.type === geoType.neighborhood) {
		return getNeighborhoodPath(geo.neighborhood, geo.city, geo.state);
	} else if (geo.type === geoType.address) {
		return getAddressPath(geo.address, geo.city, geo.state);
	}
	return null;
}

/**
 * Maps our geo paths to SOA API format
 * Our format: tx/round-rock, tx/williamson_county, tx/78664, tx/round-rock/old-town_neighborhood
 * SOA format: round-rock-ca/, ca/, ca/95121/, round-rock-ca/central-san-jose/, santa-clara-county-ca/
 */
const pathMappings = {
	city: (city, state) => `${city.toLowerCase().replace(/\s+/g, '-')}-${state.toLowerCase()}/`,
	state: (state) => `${state.toLowerCase()}/`,
	zipcode: (zipcode, state) => `${state.toLowerCase()}/${zipcode}/`,
	neighborhood: (city, neighborhood, state) =>
		`${city.toLowerCase().replace(/\s+/g, '-')}-${state.toLowerCase()}/${neighborhood
			.toLowerCase()
			.replace(/\s+/g, '-')}/`,
	county: (county, state) => {
		// Remove 'county' if it exists in the name and add it back in the correct format
		const cleanName = county
			.toLowerCase()
			.replace(/\s+/g, '-')
			.replace(/-county$/, '');
		return `${cleanName}-county-${state.toLowerCase()}/`;
	},
};

export function mapGeoToSOAPath(geo) {
	// Auto-detect geo type based on geo properties
	// Priority order: zipcode > neighborhood > city > county > state

	if (geo.zipcode) {
		return pathMappings.zipcode(geo.zipcode, geo.state);
	}

	if (geo.neighborhood) {
		return pathMappings.neighborhood(geo.city, geo.neighborhood, geo.state);
	}

	if (geo.city) {
		return pathMappings.city(geo.city, geo.state);
	}

	if (geo.county) {
		return pathMappings.county(geo.county, geo.state);
	}

	if (geo.state) {
		return pathMappings.state(geo.state);
	}

	throw new Error(
		'No valid geo data provided. Must include at least state, or city, county, zipcode, or neighborhood with state.',
	);
}

/**
 * Maps our geo path format to SOA API format
 * @param {string} geoPath - Our geo path format (e.g., "tx/round-rock")
 * @returns {string} - SOA API path format (e.g., "round-rock-ca/")
 */
export function mapGeoPathToSOAPath(geoPath) {
	if (!geoPath) {
		throw new Error('Path is required');
	}

	const geo = getGeoByPath(geoPath);
	return mapGeoToSOAPath(geo);
}

/**
 * Returns all states as sitemap links (href + text) for a given base path.
 * @param {string} basePath - Base path (e.g. '/demo/sitemap'), no trailing slash
 * @returns {{ href: string, text: string }[]}
 */
export function getStatesForSitemap(basePath) {
	const codes = getAllStateCodes();
	return codes.map((code) => ({
		href: `${basePath}/${getStatePath(code)}`,
		text: getStateFullName(code) || code,
	}));
}

/**
 * Returns all counties for a state as sitemap links.
 * @param {string} stateCode - State code (e.g. 'CA')
 * @param {string} basePath - Base path (e.g. '/demo/sitemap'), no trailing slash
 * @param {Array} countiesData - Array of county data from geo cache
 * @returns {{ href: string, text: string }[]}
 */
export function getCountiesForSitemap(stateCode, basePath, countiesData) {
	if (!stateCode || !countiesData || !Array.isArray(countiesData)) {
		return [];
	}
	const path = (basePath || '').replace(/\/$/, '');
	const stateUpper = stateCode.toUpperCase();
	const counties = new Map();
	countiesData
		.filter((c) => c.state === stateUpper)
		.forEach((c) => {
			// Use countyCode (short name like "Los Angeles") for path generation
			// county is full name (like "Los Angeles County") for display
			const countyCode = c.countyCode || c.county?.replace(/\s+County$/i, '').trim();
			const countyName = c.county || countyCode || '';
			if (!countyName) {
				return;
			}
			const href = `${path}/${getCountyPath(countyCode, stateUpper)}`;
			if (!counties.has(href)) {
				counties.set(href, {
					href,
					text: countyName,
				});
			}
		});
	return Array.from(counties.values());
}

/**
 * Returns all cities for a county as sitemap links.
 * @param {string} countyName - County name (e.g. 'Los Angeles')
 * @param {string} stateCode - State code (e.g. 'CA')
 * @param {string} basePath - Base path (e.g. '/demo/sitemap'), no trailing slash
 * @param {Array} citiesData - Array of city data from geo cache
 * @returns {{ href: string, text: string }[]}
 */
export function getCitiesForSitemap(countyName, stateCode, basePath, citiesData) {
	if (!countyName || !stateCode || !citiesData || !Array.isArray(citiesData)) {
		return [];
	}
	const path = (basePath || '').replace(/\/$/, '');
	const stateUpper = stateCode.toUpperCase();
	// County name in cities data is the full name (e.g., "Los Angeles County")
	// Match both with and without "County" suffix
	const countyMatch1 = countyName.trim();
	const countyMatch2 = countyName.replace(/\s+County$/i, '').trim();
	const cities = new Map();
	citiesData
		.filter((c) => c.state === stateUpper && (c.county === countyMatch1 || c.county === countyMatch2))
		.forEach((c) => {
			if (!c.city) {
				return;
			}
			const href = `${path}/${getCityPath(c.city, stateUpper)}`;
			if (!cities.has(href)) {
				cities.set(href, {
					href,
					text: c.city,
				});
			}
		});
	return Array.from(cities.values());
}

/**
 * Returns all zipcodes for a city as sitemap links.
 * @param {string} cityName - City name (e.g. 'Los Angeles')
 * @param {string} stateCode - State code (e.g. 'CA')
 * @param {string} basePath - Base path (e.g. '/demo/sitemap'), no trailing slash
 * @param {Array} zipcodesData - Array of zipcode data from geo cache
 * @returns {{ href: string, text: string }[]}
 */
export function getZipcodesForSitemap(cityName, stateCode, basePath, zipcodesData) {
	if (!cityName || !stateCode || !zipcodesData || !Array.isArray(zipcodesData)) {
		return [];
	}
	const path = (basePath || '').replace(/\/$/, '');
	const stateUpper = stateCode.toUpperCase();
	const cityMatch = cityName.trim();
	const zipcodes = new Map();
	zipcodesData
		.filter((z) => z.state === stateUpper && z.city === cityMatch)
		.forEach((z) => {
			if (!z.zipcode) {
				return;
			}
			const href = `${path}/${getZipcodePath(z.zipcode, stateUpper)}`;
			if (!zipcodes.has(href)) {
				zipcodes.set(href, {
					href,
					text: z.zipcode,
				});
			}
		});
	return Array.from(zipcodes.values());
}
