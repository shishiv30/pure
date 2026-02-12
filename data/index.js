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

// In-memory cache to avoid re-reading files on nodemon restarts
let geoDataCache = null;

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
	return outputFilePath;
}

function loadFromJson(name) {
	return new Promise((resolve, reject) => {
		const outputFilePath = path.join(outputFolder, `${name}.json`);
		if (fs.existsSync(outputFilePath)) {
			fs.readFile(outputFilePath, 'utf8', (err, data) => {
				if (err) {
					console.error(`Error reading ${name}.json:`, err);
					resolve(null);
				} else {
					try {
						resolve(JSON.parse(data));
					} catch (parseErr) {
						console.error(`Error parsing ${name}.json:`, parseErr);
						resolve(null);
					}
				}
			});
		} else {
			resolve(null);
		}
	});
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
	// Return cached data if available (avoids re-reading on nodemon restarts)
	if (geoDataCache) {
		console.log('Using cached geo data');
		return geoDataCache;
	}

	// Try to load from existing JSON files first (read in parallel for faster loading)
	let [state, county, city, neighborhood, zipcode] = await Promise.all([
		loadFromJson('usstates'),
		loadFromJson('uscounties'),
		loadFromJson('uscities'),
		loadFromJson('usneighborhoods'),
		loadFromJson('uszips'),
	]);

	// If any file is missing, regenerate all from CSV
	let needsRegeneration = !state || !county || !city || !neighborhood || !zipcode;

	if (needsRegeneration) {
		console.log('Regenerating geo data from CSV files...');
		state = await csvToJson('usstates');
		state = state
			.map((e) => {
				return {
					type: geoType.state,
					path: getStatePath(e.state_id),
					state: e.state_id,
					name: e.state_name,
					lat: e.lat,
					lng: e.lng,
					input: `${e.state_id} ${e.state_name}`,
					population: e.population,
				};
			})
			.sort((a, b) => {
				return b.population - a.population;
			});
		county = await csvToJson('uscounties');
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
					input: `${e.county_ascii} ${e.state_id}`,
					population: e.population,
				};
			})
			.sort((a, b) => {
				return b.population - a.population;
			});
		city = await csvToJson('uscities');
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
					input: `${e.city_ascii} ${e.state_id}`,
					population: e.population,
				};
			})
			.sort((a, b) => {
				return b.population - a.population;
			});

		neighborhood = await csvToJson('usneighborhoods');
		neighborhood = neighborhood
			.map((e) => {
				let matchedCity = city.find((c) => c.city === e.city_name && c.state === e.state_id);
				let item = {
					type: geoType.neighborhood,
					neighborhood: e.neighborhood_ascii,
					city: matchedCity.city,
					state: e.state_id,
					lat: e.lat,
					lng: e.lng,
					id: e.id,
					input: `${e.neighborhood_ascii} ${matchedCity.city} ${e.state_id}`,
				};
				item.population = matchedCity.population;
				item.path = getNeighborhoodPath(e.neighborhood_ascii, matchedCity.city, e.state_id);
				return item;
			})
			.sort((a, b) => {
				return b.population - a.population;
			});

		zipcode = await csvToJson('uszips');
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
					input: `${e.zip} ${e.state_id}`,
					population: e.population,
				};
			})
			.sort((a, b) => {
				return b.population - a.population;
			});

		// Save regenerated data
		const result = {};
		result.usstates = saveAsJson('usstates', state);
		result.uscities = saveAsJson('uscities', city);
		result.uscounties = saveAsJson('uscounties', county);
		result.usneighborhoods = saveAsJson('usneighborhoods', neighborhood);
		result.uszips = saveAsJson('uszips', zipcode);
		console.table(result);
	} else {
		console.log('Loaded geo data from existing JSON files');
	}

	// Cache the data in memory
	const result = { state, city, county, neighborhood, zipcode };
	geoDataCache = result;
	return result;
}

/**
 * Get cached geo data (returns null if not initialized)
 * @returns {{ state: Array, city: Array, county: Array, neighborhood: Array, zipcode: Array }|null}
 */
export function getGeoData() {
	return geoDataCache;
}
