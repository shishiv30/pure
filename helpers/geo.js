export const stateDict = {
	AL: 'Alabama',
	AK: 'Alaska',
	AZ: 'Arizona',
	AR: 'Arkansas',
	CA: 'California',
	CO: 'Colorado',
	CT: 'Connecticut',
	DE: 'Delaware',
	FL: 'Florida',
	GA: 'Georgia',
	HI: 'Hawaii',
	ID: 'Idaho',
	IL: 'Illinois',
	IN: 'Indiana',
	IA: 'Iowa',
	KS: 'Kansas',
	KY: 'Kentucky',
	LA: 'Louisiana',
	ME: 'Maine',
	MD: 'Maryland',
	MA: 'Massachusetts',
	MI: 'Michigan',
	MN: 'Minnesota',
	MS: 'Mississippi',
	MO: 'Missouri',
	MT: 'Montana',
	NE: 'Nebraska',
	NV: 'Nevada',
	NH: 'New Hampshire',
	NJ: 'New Jersey',
	NM: 'New Mexico',
	NY: 'New York',
	NC: 'North Carolina',
	ND: 'North Dakota',
	OH: 'Ohio',
	OK: 'Oklahoma',
	OR: 'Oregon',
	PA: 'Pennsylvania',
	RI: 'Rhode Island',
	SC: 'South Carolina',
	SD: 'South Dakota',
	TN: 'Tennessee',
	TX: 'Texas',
	UT: 'Utah',
	VT: 'Vermont',
	VA: 'Virginia',
	WA: 'Washington',
	WV: 'West Virginia',
	WI: 'Wisconsin',
	WY: 'Wyoming',
	DC: 'District of Columbia',
	AS: 'American Samoa',
	GU: 'Guam',
	MP: 'Northern Mariana Islands',
	PR: 'Puerto Rico',
	VI: 'U.S. Virgin Islands',
};

export function isValidStateCode(stateCode) {
	return stateCode && typeof stateCode === 'string' && stateCode.toUpperCase() in stateDict;
}

export function getStateFullName(stateCode) {
	if (!isValidStateCode(stateCode)) {
		return null;
	}
	return stateDict[stateCode.toUpperCase()];
}

export function getStateCode(fullName) {
	if (!fullName || typeof fullName !== 'string') {
		return null;
	}

	const normalizedName = fullName.toLowerCase().trim();

	for (const [code, name] of Object.entries(stateDict)) {
		if (name.toLowerCase() === normalizedName) {
			return code;
		}
	}

	return null;
}

export function getAllStateCodes() {
	return Object.keys(stateDict);
}

export function getAllStateFullNames() {
	return Object.values(stateDict);
}

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

/**
 * Build UI geo model from SOA Pure listing `address`.
 * @param {Record<string, unknown>|null|undefined} address
 * @returns {object|null}
 */
export function mapAddressToGeo(address) {
	if (!address || typeof address !== 'object') {
		return null;
	}
	const state = String(address.state ?? address.stateCode ?? '')
		.trim()
		.toUpperCase();
	if (!state) {
		return null;
	}
	const city = String(address.city ?? '').trim();
	const county = String(address.county ?? '').trim();
	const zipcode = String(address.zipCode ?? address.zipcode ?? '').trim();
	const street = String(
		address.addressInfo ?? address.street ?? address.addressLine1 ?? '',
	).trim();
	const geo = { state };
	if (city) {
		geo.city = city;
	}
	if (county) {
		geo.county = county;
	}
	if (zipcode) {
		geo.zipcode = zipcode;
	}
	if (street && city) {
		geo.address = street;
		geo.type = geoType.address;
	} else if (city) {
		geo.type = geoType.city;
	} else {
		geo.type = geoType.state;
	}
	const path = getPathByGeo(geo);
	if (path) {
		geo.path = path;
	}
	return geo;
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
		const stateZip = [geo.state, geo.zipcode].filter(Boolean).join(' ').trim();
		const locality = [geo.city, geo.county, stateZip].filter(Boolean).join(', ');
		if (locality) {
			return `${geo.address}, ${locality}`;
		}
		return String(geo.address);
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

	const countyKey = countyName?.trim()?.replace(/\s+County$/i, '').trim();
	const countyMatch = RegExp(`^${countyKey}`, 'i');

	const cities = new Map();
	citiesData
		.filter((c) => {
			return c.state === stateUpper && countyMatch.test(c.county);
		})
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
	const cityKey = cityName.trim();
	const cityMatch = RegExp(`^${cityKey}$`, 'i');
	const zipcodes = new Map();
	zipcodesData
		.filter((z) => z.state === stateUpper && cityMatch.test(z.city))
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

/**
 * SOA / Geoarea API → UI geo model ({ state, city?, county?, zipcode?, type, id?, path? }).
 */

function pickStateCode(item) {
	return item.stateCode ?? item.state ?? item.code ?? '';
}

function pickStateName(item) {
	return item.stateName ?? item.name ?? item.state ?? '';
}

function pickCityName(item) {
	return item.cityName ?? item.city ?? item.name ?? '';
}

function pickCountyName(item) {
	return item.countyName ?? item.county ?? item.name ?? '';
}

function pickZipcode(item) {
	return item.zipcode ?? item.zip ?? item.zipCode ?? item.code ?? '';
}

function pickNeighborhoodName(item) {
	return item.name ?? item.neighborhood ?? item.neighborhoodName ?? '';
}

/**
 * Map a single SOA state item to UI geo model.
 * @param {Object} item - Raw state from Geoarea API (e.g. stateCode, name / stateName)
 * @returns {{ state: string, type: string, id?: string, path?: string }}
 */
export function mapSoaStateToGeo(item) {
	if (!item) return null;
	const rawCode = pickStateCode(item).toString().trim();
	const rawName = pickStateName(item).toString().trim();
	const state =
		rawCode.length === 2
			? rawCode.toUpperCase()
			: getStateCode(rawName) || rawCode || rawName;
	const id = item.id ?? item.stateId ?? state;
	const path = getStatePath(state);
	return {
		state,
		type: geoType.state,
		...(id != null && { id: String(id) }),
		...(path && { path }),
	};
}

/**
 * Map a single SOA city item to UI geo model.
 * @param {Object} item - Raw city from Geoarea API (e.g. cityId, cityName, stateCode)
 * @returns {{ state: string, city: string, type: string, id?: string, path?: string }}
 */
export function mapSoaCityToGeo(item) {
	if (!item) return null;
	const rawState = (pickStateCode(item) || item.state || '').toString().trim();
	const state =
		rawState.length === 2 ? rawState.toUpperCase() : getStateCode(rawState) || rawState;
	const city = pickCityName(item).toString().trim();
	if (!state || !city) return null;
	const id = item.id ?? item.cityId ?? null;
	const path = getCityPath(city, state);
	return {
		state,
		city,
		type: geoType.city,
		...(id != null && { id: String(id) }),
		...(path && { path }),
	};
}

/**
 * Map a single SOA county item to UI geo model.
 * @param {Object} item - Raw county from Geoarea API (e.g. countyId, countyName, stateCode)
 * @returns {{ state: string, county: string, type: string, id?: string, path?: string }}
 */
export function mapSoaCountyToGeo(item) {
	if (!item) return null;
	const rawState = (pickStateCode(item) || item.state || '').toString().trim();
	const state =
		rawState.length === 2 ? rawState.toUpperCase() : getStateCode(rawState) || rawState;
	const county = pickCountyName(item).toString().trim();
	if (!state || !county) return null;
	const id = item.id ?? item.countyId ?? null;
	const path = getCountyPath(county, state);
	return {
		state,
		county,
		type: geoType.county,
		...(id != null && { id: String(id) }),
		...(path && { path }),
	};
}

/**
 * Map a single SOA zipcode item to UI geo model.
 * @param {Object} item - Raw zipcode from Geoarea API
 * @returns {{ state: string, zipcode: string, type: string, city?: string, id?: string, path?: string }}
 */
export function mapSoaZipcodeToGeo(item) {
	if (!item) return null;
	const rawState = (pickStateCode(item) || item.state || '').toString().trim();
	const state =
		rawState.length === 2 ? rawState.toUpperCase() : getStateCode(rawState) || rawState;
	const zipcode = pickZipcode(item).toString().trim();
	if (!state || !zipcode) return null;
	const id = item.id ?? zipcode;
	const path = getZipcodePath(zipcode, state);
	const geo = {
		state,
		zipcode,
		type: geoType.zipcode,
		...(id != null && { id: String(id) }),
		...(path && { path }),
	};
	const city = pickCityName(item);
	if (city) geo.city = city;
	return geo;
}

/**
 * Map a single SOA neighborhood item to UI geo model.
 * @param {Object} item - Raw neighborhood from Geoarea API (name, cityName, stateCode)
 * @returns {{ state: string, city: string, neighborhood: string, type: string, id?: string, path?: string }}
 */
export function mapSoaNeighborhoodToGeo(item) {
	if (!item) return null;
	const rawState = (pickStateCode(item) || item.state || '').toString().trim();
	const state =
		rawState.length === 2 ? rawState.toUpperCase() : getStateCode(rawState) || rawState;
	const city = pickCityName(item).toString().trim();
	const neighborhood = pickNeighborhoodName(item).toString().trim();
	if (!state || !city || !neighborhood) return null;
	const id = item.id ?? item.neighborhoodId ?? null;
	const path = getNeighborhoodPath(neighborhood, city, state);
	return {
		state,
		city,
		neighborhood,
		type: geoType.neighborhood,
		...(id != null && { id: String(id) }),
		...(path && { path }),
	};
}

/**
 * Map SOA state list to UI geo list.
 * @param {Array<Object>} items - Raw state array from Geoarea API
 * @returns {Array<{ state, type, id?, path? }>}
 */
export function mapSoaStatesToGeo(items) {
	if (!Array.isArray(items)) return [];
	return items.map(mapSoaStateToGeo).filter(Boolean);
}

/**
 * Map SOA city list to UI geo list.
 * @param {Array<Object>} items - Raw city array from Geoarea API
 * @returns {Array<{ state, city, type, id?, path? }>}
 */
export function mapSoaCitiesToGeo(items) {
	if (!Array.isArray(items)) return [];
	return items.map(mapSoaCityToGeo).filter(Boolean);
}

/**
 * Map SOA county list to UI geo list.
 * @param {Array<Object>} items - Raw county array from Geoarea API
 * @returns {Array<{ state, county, type, id?, path? }>}
 */
export function mapSoaCountiesToGeo(items) {
	if (!Array.isArray(items)) return [];
	return items.map(mapSoaCountyToGeo).filter(Boolean);
}

/**
 * Map SOA zipcode list to UI geo list.
 * @param {Array<Object>} items - Raw zipcode array from Geoarea API
 * @returns {Array<{ state, zipcode, type, city?, id?, path? }>}
 */
export function mapSoaZipcodesToGeo(items) {
	if (!Array.isArray(items)) return [];
	return items.map(mapSoaZipcodeToGeo).filter(Boolean);
}

/**
 * Map SOA neighborhood list to UI geo list.
 * @param {Array<Object>} items - Raw neighborhood array from Geoarea API
 * @returns {Array<{ state, city, neighborhood, type, id?, path? }>}
 */
export function mapSoaNeighborhoodsToGeo(items) {
	if (!Array.isArray(items)) return [];
	return items.map(mapSoaNeighborhoodToGeo).filter(Boolean);
}

/**
 * Normalize Geoarea API response to array. Handles raw array or { data: array } or { list: array }.
 * @param {unknown} data - Raw Geoarea response
 * @returns {Array<Object>}
 */
function ensureArray(data) {
	if (Array.isArray(data)) return data;
	if (data && typeof data === 'object' && Array.isArray(data.data)) return data.data;
	if (data && typeof data === 'object' && Array.isArray(data.list)) return data.list;
	return [];
}

/**
 * Map raw Geoarea states response to UI geo array.
 * @param {unknown} raw - Raw response from Geoarea /states
 * @returns {Array<{ state: string, type: string, id?: string, path?: string }>}
 */
export function mapSoaStatesResponse(raw) {
	return mapSoaStatesToGeo(ensureArray(raw));
}

/**
 * Map raw Geoarea counties response to UI geo array.
 * @param {unknown} raw - Raw response from Geoarea counties endpoints
 * @returns {Array<{ state: string, county: string, type: string, id?: string, path?: string }>}
 */
export function mapSoaCountiesResponse(raw) {
	return mapSoaCountiesToGeo(ensureArray(raw));
}

/**
 * Map raw Geoarea cities response to UI geo array.
 * @param {unknown} raw - Raw response from Geoarea cities endpoints
 * @returns {Array<{ state: string, city: string, type: string, id?: string, path?: string }>}
 */
export function mapSoaCitiesResponse(raw) {
	return mapSoaCitiesToGeo(ensureArray(raw));
}

/**
 * Map raw Geoarea neighborhoods response to UI geo array.
 * Raw payload may contain multiple neighborhood arrays:
 * - N_NEIGHBORHOOD, R_NEIGHBORHOOD, M_NEIGHBORHOOD, S_NEIGHBORHOOD
 * We should pick the first non-empty in priority order:
 * N_NEIGHBORHOOD -> R_NEIGHBORHOOD -> M_NEIGHBORHOOD, and ignore S_NEIGHBORHOOD.
 * @param {unknown} raw - Raw response from Geoarea neighborhoods endpoint
 * @returns {Array<{ state: string, city: string, neighborhood: string, type: string, id?: string, path?: string }>}
 */
export function mapSoaNeighborhoodsResponse(raw) {
	let items = [];
	if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
		const n = raw.N_NEIGHBORHOOD;
		const r = raw.R_NEIGHBORHOOD;
		const m = raw.M_NEIGHBORHOOD;
		if (Array.isArray(n) && n.length) {
			items = n;
		} else if (Array.isArray(r) && r.length) {
			items = r;
		} else if (Array.isArray(m) && m.length) {
			items = m;
		}
	} else {
		items = ensureArray(raw);
	}
	return mapSoaNeighborhoodsToGeo(items);
}

/**
 * Map raw Geoarea zipcodes/postalcodes response to UI geo array.
 * @param {unknown} raw - Raw response from Geoarea postalcodes endpoints
 * @returns {Array<{ state: string, zipcode: string, type: string, city?: string, id?: string, path?: string }>}
 */
export function mapSoaZipcodesResponse(raw) {
	return mapSoaZipcodesToGeo(ensureArray(raw));
}

/**
 * Map raw Geoarea single-item response (e.g. city by IP) to UI geo object.
 * Returns null if unmappable; caller can fall back to raw.
 * @param {unknown} raw - Raw response (single object or array)
 * @returns {{ state: string, city?: string, county?: string, type: string, id?: string, path?: string } | null}
 */
export function mapSoaSingleItemResponse(raw) {
	if (!raw || Array.isArray(raw)) return null;
	return mapSoaItemToGeo(raw);
}

/**
 * Map one SOA item to UI geo model { state, city?, county?, ... }.
 * Detects type by which of state/city/county/zipcode fields are present.
 * @param {Object} item - Raw item from Geoarea API
 * @returns {{ state: string, city?: string, county?: string, type: string, id?: string, path?: string } | null}
 */
export function mapSoaItemToGeo(item) {
	if (!item) return null;
	const neighborhood = pickNeighborhoodName(item);
	const county = pickCountyName(item);
	const city = pickCityName(item);
	const zip = pickZipcode(item);
	if (neighborhood && city) return mapSoaNeighborhoodToGeo(item);
	if (county && !city && !zip) return mapSoaCountyToGeo(item);
	if (city) return mapSoaCityToGeo(item);
	if (zip) return mapSoaZipcodeToGeo(item);
	return mapSoaStateToGeo(item);
}
