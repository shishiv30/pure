import fs from 'fs';
import path from 'path';
import {
	getStatePath,
	getCityPath,
	getCountyPath,
	getZipcodePath,
	getNeighborhoodPath,
} from '../helpers/geo.js';
import { geoType } from '../helpers/geo.js';

const rootPath = process.cwd(); // Get the root directory
const inputFolder = path.join(rootPath, 'data/csv'); // Define the input folder
const outputFolder = path.join(rootPath, 'dist'); // Define the output folder

function trimValue(value) {
	//remove space and double quotes from begin and end of the string
	return value.replace(/^[\s"]+|[\s"]+$/g, '');
}

function _csvToJson(csv) {
	const lines = csv.split('\n');
	const result = [];
	const headers = lines[0].split(',').map((header) => trimValue(header));

	for (let i = 1; i < lines.length; i++) {
		const obj = {};
		const currentLine = lines[i].split(',');

		for (let j = 0; j < headers.length; j++) {
			let value = trimValue(currentLine[j] ? currentLine[j].trim() : null);
			let key = headers[j];
			if (key && value) {
				obj[key] = value;
			}
		}

		result.push(obj);
	}

	return result;
}

function saveAsJson(name, data) {
	if (!fs.existsSync(outputFolder)) {
		fs.mkdirSync(outputFolder);
	}
	const outputFilePath = path.join(outputFolder, `${name}.json`);
	fs.writeFileSync(outputFilePath, JSON.stringify(data, null, 2));
	console.log(`${name} CSV has been converted to JSON and stored in ${outputFilePath}`);
}

function csvToJson(name) {
	return new Promise((resolve, reject) => {
		const inputFilePath = path.join(inputFolder, `${name}.csv`);

		fs.readFile(inputFilePath, 'utf8', (err, data) => {
			if (err) {
				console.error('Error reading the CSV file:', err);
				resolve(null);
			}

			resolve(_csvToJson(data));
		});
	});
}

export async function initialGeoData() {
	let state = await csvToJson('usstates');
	state = state
		.map((e) => {
			return {
				type: geoType.state,
				path: getStatePath(e.state_id),
				state: e.state_id,
				name: e.state_name,
				lat: e.lat,
				lng: e.lng,
				population: e.population,
			};
		})
		.sort((a, b) => {
			return b.population - a.population;
		});
	let county = await csvToJson('uscounties');
	county = county
		.map((e) => {
			return {
				type: geoType.county,
				path: getCountyPath(e.county_ascii, e.state_id),
				county: e.county_full,
				countyCode: e.county,
				state: e.state_id,
				lat: e.lat,
				lng: e.lng,
				id: e.county_fips,
				population: e.population,
			};
		})
		.sort((a, b) => {
			return b.population - a.population;
		});
	let city = await csvToJson('uscities');
	city = city
		.map((e) => {
			let matchedCounty = county.find(
				(c) => c.countyCode === e.county_name && c.state === e.state_id,
			);
			return {
				type: geoType.city,
				city: e.city_ascii,
				path: getCityPath(e.city_ascii, e.state_id),
				county: matchedCounty ? matchedCounty.county : e.county_name,
				state: e.state_id,
				lat: e.lat,
				lng: e.lng,
				population: e.population,
			};
		})
		.sort((a, b) => {
			return b.population - a.population;
		});

	let neighborhood = await csvToJson('usneighborhoods');
	neighborhood = neighborhood
		.map((e) => {
			let matchedCity = city.find((c) => c.city === e.city_name && c.state === e.state_id);
			let item = {
				type: geoType.neighborhood,
				neighborhood: e.neighborhood_ascii,
				neighborhoodFull: `${e.neighborhood_ascii}, ${e.state_id}`,
				city: matchedCity.city,
				state: e.state_id,
				lat: e.lat,
				lng: e.lng,
				id: e.id,
			};
			item.population = matchedCity.population;
			item.path = getNeighborhoodPath(e.neighborhood_ascii, matchedCity.city, e.state_id);
			return item;
		})
		.sort((a, b) => {
			return b.population - a.population;
		});

	let zipcode = await csvToJson('uszips');
	zipcode = zipcode
		.map((e) => {
			return {
				type: geoType.zipcode,
				zipcode: e.zip,
				path: getZipcodePath(e.zip, e.state_id),
				city: e.city,
				county: e.county_name,
				state: e.state_id,
				lat: e.lat,
				lng: e.lng,
				population: e.population,
			};
		})
		.sort((a, b) => {
			return b.population - a.population;
		});

	saveAsJson('usstates', state);
	saveAsJson('uscities', city);
	saveAsJson('uscounties', county);
	saveAsJson('usneighborhoods', neighborhood);
	saveAsJson('uszips', zipcode);
	return { state, city, county, neighborhood, zipcode };
}
