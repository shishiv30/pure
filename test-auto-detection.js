import { mapGeoToSOAPath } from './helpers/geo.js';

// Test cases for auto-detection
const testCases = [
	{
		data: { state: 'tx' },
		expected: 'tx/',
		description: 'State only',
	},
	{
		data: { state: 'tx', city: 'round-rock' },
		expected: 'round-rock-tx/',
		description: 'City with state',
	},
	{
		data: { state: 'tx', county: 'williamson' },
		expected: 'williamson-county-tx/',
		description: 'County with state',
	},
	{
		data: { state: 'tx', zipcode: '78664' },
		expected: 'tx/78664/',
		description: 'Zipcode with state (highest priority)',
	},
	{
		data: { state: 'tx', city: 'round-rock', neighborhood: 'old-town' },
		expected: 'round-rock-tx/old-town/',
		description: 'Neighborhood with city and state (higher priority than city)',
	},
	{
		data: { state: 'ca', city: 'san-jose' },
		expected: 'san-jose-ca/',
		description: 'California city',
	},
	{
		data: { state: 'ca', county: 'santa-clara' },
		expected: 'santa-clara-county-ca/',
		description: 'California county',
	},
	{
		data: { state: 'ca', zipcode: '95121' },
		expected: 'ca/95121/',
		description: 'California zipcode',
	},
	{
		data: { state: 'ny', city: 'brooklyn' },
		expected: 'brooklyn-ny/',
		description: 'New York city',
	},
];

console.log('Testing auto-detection in mapGeoToSOAPath:');
console.log('======================================');

testCases.forEach(({ data, expected, description }) => {
	try {
		const result = mapGeoToSOAPath(data);
		const status = result === expected ? '✅ PASS' : '❌ FAIL';
		console.log(`${status} ${description}`);
		console.log(`  Input data:`, data);
		console.log(`  Expected: ${expected}`);
		console.log(`  Result: ${result}`);
		console.log('');
	} catch (error) {
		console.log(`❌ FAIL ${description}`);
		console.log(`  Input data:`, data);
		console.log(`  Error: ${error.message}`);
		console.log('');
	}
});

// Test error cases
console.log('Testing error cases:');
console.log('===================');

const errorCases = [
	{
		data: {},
		description: 'Empty data object',
	},
	{
		data: { city: 'round-rock' },
		description: 'City without state',
	},
	{
		data: { county: 'williamson' },
		description: 'County without state',
	},
	{
		data: { zipcode: '78664' },
		description: 'Zipcode without state',
	},
	{
		data: { city: 'round-rock', neighborhood: 'old-town' },
		description: 'City and neighborhood without state',
	},
];

errorCases.forEach(({ data, description }) => {
	try {
		const result = mapGeoToSOAPath(data);
		console.log(`❌ FAIL ${description} - Should have thrown error but returned: ${result}`);
	} catch (error) {
		console.log(`✅ PASS ${description} - Correctly threw error: ${error.message}`);
	}
	console.log('');
});
