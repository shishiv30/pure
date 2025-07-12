import { getCityPath, getCountyPath, getGeoByPath, getPathByGeo, geoType } from './helpers/geo.js';

// Helper function to compare objects regardless of property order
function deepEqual(obj1, obj2) {
	if (obj1 === obj2) return true;
	if (obj1 == null || obj2 == null) return obj1 === obj2;
	if (typeof obj1 !== typeof obj2) return false;

	if (typeof obj1 !== 'object') return obj1 === obj2;

	const keys1 = Object.keys(obj1);
	const keys2 = Object.keys(obj2);

	if (keys1.length !== keys2.length) return false;

	for (const key of keys1) {
		if (!keys2.includes(key)) return false;
		if (!deepEqual(obj1[key], obj2[key])) return false;
	}

	return true;
}

// Test cases for geo mapping with "City" and "County" suffixes
const testCases = [
	{
		input: { city: 'San Mateo City', state: 'CA' },
		expected: 'ca/san-mateo',
		description: 'City with "City" suffix',
	},
	{
		input: { city: 'San Mateo', state: 'CA' },
		expected: 'ca/san-mateo',
		description: 'City without "City" suffix',
	},
	{
		input: { county: 'San Mateo County', state: 'CA' },
		expected: 'ca/san-mateo_county',
		description: 'County with "County" suffix',
	},
	{
		input: { county: 'San Mateo', state: 'CA' },
		expected: 'ca/san-mateo_county',
		description: 'County without "County" suffix',
	},
	{
		input: { city: 'New York City', state: 'NY' },
		expected: 'ny/new-york',
		description: 'New York City',
	},
	{
		input: { city: 'Los Angeles City', state: 'CA' },
		expected: 'ca/los-angeles',
		description: 'Los Angeles City',
	},
	{
		input: { county: 'Los Angeles County', state: 'CA' },
		expected: 'ca/los-angeles_county',
		description: 'Los Angeles County',
	},
];

console.log('Testing geo path generation with "City" and "County" suffixes:');
console.log('============================================================');

testCases.forEach(({ input, expected, description }) => {
	try {
		let result;
		if (input.city) {
			result = getCityPath(input.city, input.state);
		} else if (input.county) {
			result = getCountyPath(input.county, input.state);
		}

		const status = result === expected ? '✅ PASS' : '❌ FAIL';
		console.log(`${status} ${description}`);
		console.log(`  Input:`, input);
		console.log(`  Expected: ${expected}`);
		console.log(`  Result: ${result}`);
		console.log('');
	} catch (error) {
		console.log(`❌ FAIL ${description}`);
		console.log(`  Input:`, input);
		console.log(`  Error: ${error.message}`);
		console.log('');
	}
});

// Test reverse mapping (path to geo)
console.log('Testing reverse mapping (path to geo):');
console.log('=====================================');

const reverseTestCases = [
	{
		path: 'ca/san-mateo',
		expected: { type: geoType.city, city: 'san mateo', state: 'ca' },
		description: 'City path to geo',
	},
	{
		path: 'ca/san-mateo_county',
		expected: { type: geoType.county, county: 'san mateo', state: 'ca' },
		description: 'County path to geo',
	},
	{
		path: 'ny/new-york',
		expected: { type: geoType.city, city: 'new york', state: 'ny' },
		description: 'New York city path to geo',
	},
	{
		path: 'ca/los-angeles_county',
		expected: { type: geoType.county, county: 'los angeles', state: 'ca' },
		description: 'Los Angeles county path to geo',
	},
];

reverseTestCases.forEach(({ path, expected, description }) => {
	try {
		const result = getGeoByPath(path);
		const status = deepEqual(result, expected) ? '✅ PASS' : '❌ FAIL';
		console.log(`${status} ${description}`);
		console.log(`  Input: ${path}`);
		console.log(`  Expected:`, expected);
		console.log(`  Result:`, result);
		console.log('');
	} catch (error) {
		console.log(`❌ FAIL ${description}`);
		console.log(`  Input: ${path}`);
		console.log(`  Error: ${error.message}`);
		console.log('');
	}
});

// Test getPathByGeo function
console.log('Testing getPathByGeo function:');
console.log('=============================');

const geoTestCases = [
	{
		geo: { type: geoType.city, city: 'San Mateo City', state: 'CA' },
		expected: 'ca/san-mateo',
		description: 'City geo with "City" suffix',
	},
	{
		geo: { type: geoType.county, county: 'San Mateo County', state: 'CA' },
		expected: 'ca/san-mateo_county',
		description: 'County geo with "County" suffix',
	},
	{
		geo: { type: geoType.city, city: 'New York City', state: 'NY' },
		expected: 'ny/new-york',
		description: 'New York City geo',
	},
];

geoTestCases.forEach(({ geo, expected, description }) => {
	try {
		const result = getPathByGeo(geo);
		const status = result === expected ? '✅ PASS' : '❌ FAIL';
		console.log(`${status} ${description}`);
		console.log(`  Input:`, geo);
		console.log(`  Expected: ${expected}`);
		console.log(`  Result: ${result}`);
		console.log('');
	} catch (error) {
		console.log(`❌ FAIL ${description}`);
		console.log(`  Input:`, geo);
		console.log(`  Error: ${error.message}`);
		console.log('');
	}
});
