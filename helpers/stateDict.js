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

// Helper function to check if a string is a valid state code
export function isValidStateCode(stateCode) {
	return stateCode && typeof stateCode === 'string' && stateCode.toUpperCase() in stateDict;
}

// Helper function to get state full name from state code
export function getStateFullName(stateCode) {
	if (!isValidStateCode(stateCode)) {
		return null;
	}
	return stateDict[stateCode.toUpperCase()];
}

// Helper function to get state code from full name (case-insensitive)
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

// Get all state codes as an array
export function getAllStateCodes() {
	return Object.keys(stateDict);
}

// Get all state full names as an array
export function getAllStateFullNames() {
	return Object.values(stateDict);
}
