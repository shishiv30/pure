/**
 * Schools assigned to homes for sale in a city. SOA has no working "schools in city"
 * list, so this samples the city's listings and asks `assignedSchools` for each
 * location, then counts sampled homes per school. Cached per city for 12h.
 */
import { searchHouse } from '../routes/api.soa.property.js';
import { getNearbySchoolsByLocation } from '../routes/api.soa.school.js';

const CACHE_MS = 12 * 60 * 60 * 1000;
const SAMPLE_HOMES = 100;
const MAX_POINTS = 60;
const CONCURRENCY = 6;
const cache = new Map();

/** `schools/round-rock-tx/fern-bluff-…/` → `{ city: 'round-rock', state: 'tx' }` */
function schoolCity(dspUrl) {
	const m = String(dspUrl || '').match(/^schools\/([a-z0-9-]+)-([a-z]{2})\//i);
	return m ? { city: m[1].toLowerCase(), state: m[2].toLowerCase() } : null;
}

/** `p,e` → ['elementary']; a K-8 school lands in both lists. */
function levels(levelCode) {
	const codes = String(levelCode || '').split(',');
	return [
		codes.includes('e') && 'elementary',
		codes.includes('m') && 'middle',
		codes.includes('h') && 'high',
	].filter(Boolean);
}

async function mapLimit(items, limit, fn) {
	const out = [];
	let i = 0;
	const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
		while (i < items.length) {
			const idx = i++;
			out[idx] = await fn(items[idx]).catch(() => null);
		}
	});
	await Promise.all(workers);
	return out;
}

async function load(geo) {
	const found = await searchHouse(geo, { maxCountPerPage: SAMPLE_HOMES });
	const listings = found?.listings || [];
	const points = new Map();
	for (const l of listings) {
		const lat = Number(l.latitude ?? l.address?.latitude);
		const lng = Number(l.longitude ?? l.address?.longitude);
		if (!lat || !lng) continue;
		// ~100 m grid: homes on the same block share one lookup
		const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
		points.set(key, (points.get(key) || 0) + 1);
	}
	const keys = [...points.keys()].slice(0, MAX_POINTS);
	const results = await mapLimit(keys, CONCURRENCY, (key) => getNearbySchoolsByLocation(key));

	const schools = new Map();
	results.forEach((r, idx) => {
		const homes = points.get(keys[idx]);
		for (const s of r?.assignedSchools || []) {
			if (!s?.id) continue;
			const row = schools.get(s.id) || {
				id: String(s.id),
				name: s.schoolName,
				rating: s.rating ?? null,
				type: s.type || '',
				grades: s.level || '',
				levels: levels(s.levelCode),
				ncesId: s.ncesId || '',
				city: schoolCity(s.dspUrl),
				homes: 0,
			};
			row.homes += homes;
			schools.set(s.id, row);
		}
	});
	const byRating = (a, b) => (b.rating ?? -1) - (a.rating ?? -1) || b.homes - a.homes;
	return {
		sampled: listings.length,
		total: found?.totalCount ?? listings.length,
		schools: [...schools.values()].sort(byRating),
	};
}

/**
 * @param {{ state: string, city: string }} geo — city geo from getGeoByPath
 * @returns {Promise<{ sampled: number, total: number, schools: object[] }>}
 */
export async function getCitySchools(geo) {
	const key = `${geo.state}/${geo.city}`.toLowerCase();
	const hit = cache.get(key);
	if (hit && Date.now() - hit.at < CACHE_MS) return hit.promise;
	const promise = load(geo);
	cache.set(key, { at: Date.now(), promise });
	promise.catch(() => cache.delete(key));
	return promise;
}
