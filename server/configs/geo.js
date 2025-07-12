import { geoType } from '../../helpers/geo.js';

export default {
	name: 'geo',
	get: function (payload) {
		return new Promise((resolve, reject) => {
			try {
				// Validate payload
				if (!payload || typeof payload !== 'object') {
					console.warn('geo.get: Invalid payload parameter');
					resolve([]);
					return;
				}

				let { type, text, size } = payload;

				// Validate text parameter
				if (!text || typeof text !== 'string') {
					console.warn('geo.get: Invalid or missing text parameter');
					resolve([]);
					return;
				}

				// Set default type if not provided
				if (!type) {
					type = geoType.city;
				}

				// Validate type parameter
				if (!Object.values(geoType).includes(type)) {
					console.warn(`geo.get: Invalid type parameter: ${type}`);
					resolve([]);
					return;
				}

				// Set default size if not provided
				if (!size || typeof size !== 'number' || size <= 0) {
					size = 10;
				}

				// Check if Fuse instance exists
				const fuseInstance = globalThis[type];
				if (!fuseInstance) {
					console.warn(`geo.get: No Fuse instance found for type ${type}`);
					resolve([]);
					return;
				}

				// Perform search with error handling
				try {
					const searchResults = fuseInstance.search(text);
					const results = searchResults.slice(0, size).map((e) => e.item);
					resolve(results);
				} catch (searchError) {
					console.error('geo.get: Search operation failed', searchError);
					resolve([]);
				}
			} catch (error) {
				console.error('geo.get: Unexpected error', error);
				resolve([]);
			}
		});
	},
};
