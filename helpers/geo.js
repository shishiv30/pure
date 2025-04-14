export const geoType = {
	state: 'state',
	city: 'city',
	county: 'county',
	zip: 'zip',
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
	let data = [
		{
			text: 'Home',
			href: '/',
		},
	];
	let path = _path || '';
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
		if (geo.zip) {
			data.push({
				text: geo.zip,
				href: `${path}/${getZipPath(geo.zip, geo.state)}`,
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
	if (/^[a-z]{2}$/i.test(segments[0])) {
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
		//remove _county from the end of the string
		geo.county = segments[1].replace(/_county$/i, '').replace(/-/g, ' ');
		return geo;
	} else if (segments[1].match(/^\d{5}$/)) {
		geo.type = geoType.zip;
		geo.zip = segments[1];
		return geo;
	}

	geo.city = segments[1].replace(/-/g, ' ');

	if (!segments[2]) {
		geo.type = geoType.city;
		return geo;
	}

	if (segments[2].endsWith('_address')) {
		geo.type = geoType.address;
		geo.address = segments[2].replace(/_address$/i).replace(/-/g, ' ');
		return geo;
	} else if (segments[2].endsWith('_neighborhood')) {
		geo.type = geoType.neighborhood;
		geo.neighborhood = segments[2].replace(/_neighborhood$/i).replace(/-/g, ' ');
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
	let cityCode = city.toLowerCase().replace(/\s+/g, '-');
	return `${stateCode}/${cityCode}`;
}

export function getCountyPath(county, state) {
	let stateCode = state.toLowerCase();
	let countyCode = county.toLowerCase().replace(/\s+/g, '-');
	return `${stateCode}/${countyCode}_county`;
}

export function getZipPath(zip, state) {
	let stateCode = state.toLowerCase();
	return `${stateCode}/${zip}`;
}

export function getAddressPath(address, city, state) {
	let stateCode = state.toLowerCase();
	let cityCode = city.toLowerCase().replace(/\s+/g, '-');
	let addressCode = address.toLowerCase().replace(/\s+/g, '-');
	return `${stateCode}/${cityCode}/${addressCode}_address`;
}

export function getNeighborhoodPath(neighborhood, city, state) {
	let stateCode = state.toLowerCase();
	let cityCode = city.toLowerCase().replace(/\s+/g, '-');
	let neighborhoodCode = neighborhood.toLowerCase().replace(/\s+/g, '-');
	return `${stateCode}/${cityCode}/${neighborhoodCode}_neighborhood`;
}

export function getGeoDisplayText(geo) {
	if (!geo) {
		return '';
	}

	if (geo.address) {
		return `${geo.address} ${geo.city}, ${geo.state} ${geo.zip}`;
	} else if (geo.neighborhood) {
		if (geo.city.include(geo.neighborhood)) {
			return `${geo.neighborhood}, ${geo.state}`;
		}
		return `${geo.neighborhood} ${geo.city}, ${geo.state}`;
	} else if (geo.city) {
		return `${geo.city}, ${geo.state}`;
	} else if (geo.county) {
		return `${geo.county}, ${geo.state}`;
	} else if (geo.zip) {
		return `${geo.zip} ${geo.state}`;
	} else if (geo.state) {
		return `${geo.state}`;
	}

	return '';
}
export function getGeoByData() {}

export function getPathByGeo(geo) {
	if (geo.type === geoType.state) {
		return getStatePath(geo.state);
	} else if (geo.type === geoType.city) {
		return getCityPath(geo.city, geo.state);
	} else if (geo.type === geoType.county) {
		return getCountyPath(geo.county, geo.state);
	} else if (geo.type === geoType.zip) {
		return getZipPath(geo.zip, geo.state);
	} else if (geo.type === geoType.neighborhood) {
		return getNeighborhoodPath(geo.neighborhood, geo.city, geo.state);
	}
}
