/**
 * Pagination model shared by the server (SSR) and the client (SPA re-render).
 * Pages are 1-based and live in the `index` query parameter (page size: `size`),
 * matching helpers/filter.js. Page 1 drops `index` so it keeps the canonical URL.
 */

export const DEFAULT_PAGE_SIZE = 50;

/**
 * Page numbers to show: first, last, and a window around the current page, with
 * `null` for each gap. `pageWindow(7, 20)` → [1, null, 6, 7, 8, null, 20]
 * @param {number} current
 * @param {number} pages
 * @param {number} [siblings] pages on each side of the current one
 * @returns {(number|null)[]}
 */
export function pageWindow(current, pages, siblings = 1) {
	const shown = new Set([1, pages]);
	for (let p = current - siblings; p <= current + siblings; p++) {
		if (p >= 1 && p <= pages) shown.add(p);
	}
	// Fill a single-page gap instead of showing "…" for one hidden page
	const sorted = [...shown].sort((a, b) => a - b);
	const out = [];
	sorted.forEach((p, i) => {
		const prev = sorted[i - 1];
		if (prev !== undefined && p - prev === 2) out.push(prev + 1);
		else if (prev !== undefined && p - prev > 2) out.push(null);
		out.push(p);
	});
	return out;
}

/**
 * `?bed=3_&index=2` with `index` set to `page` (removed for page 1).
 * @param {string} search — current query string, with or without `?`
 * @param {number} page
 * @returns {string} query string with leading `?`, or ''
 */
export function searchWithPage(search, page) {
	const params = new URLSearchParams(String(search || '').replace(/^\?/, ''));
	if (page > 1) params.set('index', String(page));
	else params.delete('index');
	const s = params.toString();
	return s ? `?${s}` : '';
}

/**
 * @param {{ total: number, path: string, search?: string, index?: number|string, size?: number|string, siblings?: number }} opt
 *   total — result count; path — pathname of the list page; search — its current query string
 * @returns {{ current: number, pages: number, from: number, to: number, total: number,
 *   prev: { href: string, page: number }|null, next: { href: string, page: number }|null,
 *   items: Array<{ page: number, href: string, current: boolean }|{ gap: true }> }|null}
 *   null when everything fits on one page
 */
export function getPagination({ total, path, search = '', index, size, siblings = 1 }) {
	const count = Math.max(0, Number(total) || 0);
	const pageSize = Math.max(1, Number(size) || DEFAULT_PAGE_SIZE);
	const pages = Math.ceil(count / pageSize);
	if (pages <= 1) {
		return null;
	}
	const current = Math.min(pages, Math.max(1, Number(index) || 1));
	const link = (page) => ({ page, href: `${path}${searchWithPage(search, page)}` });
	return {
		current,
		pages,
		total: count,
		from: (current - 1) * pageSize + 1,
		to: Math.min(count, current * pageSize),
		prev: current > 1 ? link(current - 1) : null,
		next: current < pages ? link(current + 1) : null,
		items: pageWindow(current, pages, siblings).map((page) =>
			page === null ? { gap: true } : { ...link(page), current: page === current },
		),
	};
}
