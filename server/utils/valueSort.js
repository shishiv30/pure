/**
 * `sort=value`: best value first = lowest price per sqft (living area, or lot size for land).
 * SOA can't sort by $/sqft, so this pulls the first VALUE_POOL listings of the search
 * (SOA's default order, 400 per call), ranks them here, and pages through the ranking.
 * Left out: no size, a placeholder price under MIN_PRICE ($1 land), or under MIN_PPSF, which
 * means a broken size (a 45,540 sqft lot stored as 45,540 acres → $0.000007/sqft).
 */
import { getSoaPricePerSqft } from '../../helpers/property.js';

export const VALUE_SORT = 'VALUE';
const SOA_MAX_PAGE = 400;
export const VALUE_POOL = 2400;
const MIN_PRICE = 1000;
const MIN_PPSF = 0.01; // ≈ $435/acre, below the cheapest real land
const DEFAULT_PAGE_SIZE = 50;
const CACHE_MS = 5 * 60 * 1000;
const CACHE_MAX = 50;
const cache = new Map();

async function loadRanked(fetchPage, filter) {
	const base = { ...filter };
	delete base.sortColumn;
	delete base.sortOrder;
	delete base.pageIndex;
	delete base.maxCountPerPage;
	const pages = Math.ceil(VALUE_POOL / SOA_MAX_PAGE);
	const results = await Promise.all(
		Array.from({ length: pages }, (_, i) =>
			fetchPage({ ...base, pageIndex: i + 1, maxCountPerPage: SOA_MAX_PAGE }).catch(() => null),
		),
	);
	const first = results.find(Boolean);
	if (!first) {
		throw new Error('Value sort: search failed');
	}
	const seen = new Set();
	const ranked = [];
	for (const r of results) {
		for (const listing of r?.listings || []) {
			if (!listing?.id || seen.has(listing.id)) continue;
			seen.add(listing.id);
			const ppsf = getSoaPricePerSqft(listing);
			const price = ppsf && ppsf * Number(listing.sqftTotal || listing.lotSizeSqft);
			if (ppsf >= MIN_PPSF && price >= MIN_PRICE) ranked.push({ listing, ppsf });
		}
	}
	ranked.sort((a, b) => a.ppsf - b.ppsf);
	return { first, ranked, scanned: seen.size, total: first.totalCount ?? seen.size };
}

/**
 * @param {(filter: object) => Promise<object>} fetchPage — one SOA search call for this geo
 * @param {object} geo
 * @param {object} filter — parsed filter with sortColumn VALUE
 * @returns {Promise<object>} SOA-shaped result: listings for the requested page, totalCount = ranked count, plus valueSort info
 */
export async function searchHouseByValue(fetchPage, geo, filter) {
	const key = JSON.stringify([geo, { ...filter, pageIndex: 0, maxCountPerPage: 0, sortOrder: '' }]);
	let hit = cache.get(key);
	if (!hit || Date.now() - hit.at > CACHE_MS) {
		hit = { at: Date.now(), promise: loadRanked(fetchPage, filter) };
		hit.promise.catch(() => cache.delete(key));
		cache.set(key, hit);
		if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
	}
	const { first, ranked, scanned, total } = await hit.promise;
	const order = filter.sortOrder === 'DESC' ? [...ranked].reverse() : ranked;
	const size = Number(filter.maxCountPerPage) || DEFAULT_PAGE_SIZE;
	const index = Math.max(1, Number(filter.pageIndex) || 1);
	const slice = order.slice((index - 1) * size, index * size);
	return {
		...first,
		listings: slice.map((r) => r.listing),
		totalCount: ranked.length,
		articleTotalCount: ranked.length,
		valueSort: { ranked: ranked.length, scanned, total },
	};
}
