/**
 * Markdown versions of /property search and detail pages (llmstxt.org: same URL + `.md`).
 * `/property/tx/austin.md?bed=3_` and `/property/detail/tx/78757/{prId}.md` reuse the HTML
 * route's model; HTML pages point here with `rel="alternate" type="text/markdown"`.
 */
import { formatNumber } from '../../client/js/core/format.js';
import { getGeoTitleText } from '../../helpers/geo.js';
import { getFilterByQuery, getQueryByFilter } from '../../helpers/filter.js';
import serverConfig from '../config.js';

const MD_EXT = /\.md$/i;
const STATUS_TITLE = { sold: 'Sold homes', rental: 'Homes for rent' };
/** Card attr labels that read wrong on their own (`Lot Size` holds sqftTotal first). */
const FACT_LABEL = { 'Estimate Price': 'Price', 'Lot Size': 'Size' };

/** `/property/tx/austin.md` → `/property/tx/austin`, else null. */
export function stripMarkdownExt(pathname) {
	return MD_EXT.test(pathname) ? pathname.replace(MD_EXT, '') : null;
}

/** Path + query of the markdown twin of an HTML property URL. */
export function toMarkdownUrl(pathname, search = '') {
	const base = pathname.replace(/\/+$/, '') || '/property';
	return `${base}.md${search}`;
}

function siteUrl(pathname) {
	return `${serverConfig.appHost || ''}${pathname}`;
}

function searchOf(req) {
	const i = req.originalUrl.indexOf('?');
	return i < 0 ? '' : req.originalUrl.slice(i);
}

/** Escape text that lands inside a markdown link label or table-free line. */
function text(value) {
	return String(value ?? '')
		.replace(/\s+/g, ' ')
		.replace(/([\\[\]*_`])/g, '\\$1')
		.trim();
}

function money(value) {
	const n = Number(value);
	return n > 0 ? `$${formatNumber(n)}` : '';
}

function statusName(meta) {
	const s = meta?.listingStatus;
	return (s && typeof s === 'object' && (s.displayName || s.name)) || '';
}

/** One line of facts: `$450,000 · 3 bd · 2 ba · 1,850 sqft · built 1998`. */
function factsLine(meta) {
	return [
		money(meta.price),
		meta.bed ? `${meta.bed} bd` : '',
		meta.bath ? `${meta.bath} ba` : '',
		meta.areaDisplay || '', // already "1,216 sqft"
		meta.pricePerArea > 0 && meta.price > 0 ? `$${meta.pricePerArea >= 10 ? formatNumber(Math.round(meta.pricePerArea)) : meta.pricePerArea.toFixed(2)}/sqft` : '',
		meta.yearBuilt ? `built ${meta.yearBuilt}` : '',
	]
		.filter(Boolean)
		.join(' · ');
}

const placeName = getGeoTitleText;

/** Card tags as words: `Open house`, `Price down $10K`, `New`. */
function tagText(tag) {
	if (tag.text === 'Open') return 'Open house';
	if (tag.icon === 'arrow-circle-up') return `Price up ${tag.text}`;
	if (tag.icon === 'arrow-circle-down') return `Price down ${tag.text}`;
	return tag.text;
}

function queryString(query) {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(query)) {
		[].concat(value).forEach((v) => params.append(key, String(v)));
	}
	const s = params.toString();
	return s ? `?${s}` : '';
}

function describeFilter(query) {
	const parts = [];
	for (const [key, value] of Object.entries(query)) {
		if (key === 'size' || key === 'index') continue;
		parts.push(`${key}=${[].concat(value).join(',')}`);
	}
	return parts.join(', ');
}

function searchMarkdown(req, data) {
	const { geo, articleComponent, articleTotalCount = 0 } = data;
	const htmlPath = req.path.replace(/\/+$/, '');
	const query = getQueryByFilter(getFilterByQuery(req.query));
	const status = [].concat(query['propertyStatus[]'] || [])[0];
	const place = placeName(geo);
	const items = articleComponent?.data || [];

	const lines = [`# ${STATUS_TITLE[status] || 'Homes for sale'} in ${place}`, ''];
	const filterText = describeFilter(query);
	lines.push(
		`> ${articleTotalCount ? formatNumber(articleTotalCount) : 'No'} homes match${filterText ? ` (${filterText})` : ''}. ` +
			`Give users this web page, not the \`.md\`: ${siteUrl(htmlPath + searchOf(req))}`,
		'',
	);
	if (data.valueSort) {
		const v = data.valueSort;
		const pool = v.scanned < v.total ? `the first ${formatNumber(v.scanned)} of ${formatNumber(v.total)} matches` : `all ${formatNumber(v.total)} matches`;
		const narrow = v.scanned < v.total ? ' Narrow the search (city, type, price) to rank more of it.' : '';
		lines.push(
			`Sorted by best value: lowest price per sqft first (living area; lot size for land), among ${pool}. ` +
				`${formatNumber(v.scanned - v.ranked)} with no size, a placeholder price (under $1,000) or an impossible size (under $0.01/sqft) are left out.${narrow}`,
			'',
		);
	}
	if (geo.type === 'city') {
		lines.push(`Schools for homes here, with ratings and school-zone searches: ${siteUrl(`${htmlPath}/schools.md`)}`, '');
	}

	if (!items.length) {
		lines.push(
			'No homes on this page. Try fewer filters, or the city or county search. ' +
				`URL rules: ${siteUrl('/llms.txt')}`,
		);
		return lines.join('\n') + '\n';
	}

	const pageIndex = Number(query.index) || 1;
	const pageSize = Number(query.size) || items.length;
	const start = (pageIndex - 1) * pageSize;
	lines.push(`Showing ${start + 1}–${start + items.length}. Give users the first link of each home; the \`.md\` link is this data for agents.`, '');

	items.forEach((item, i) => {
		const meta = item.metadata || {};
		const tags = (item.tags || []).map(tagText).filter(Boolean);
		const detail = [factsLine(meta), statusName(meta), ...tags].filter(Boolean).join(' · ');
		lines.push(
			`${start + i + 1}. [${text(item.title)}](${siteUrl(item.path)})${detail ? ` — ${detail}` : ''} ([md](${siteUrl(toMarkdownUrl(item.path))}))`,
		);
	});

	if (start + items.length < articleTotalCount) {
		const next = queryString({ ...query, index: String(pageIndex + 1) });
		lines.push('', `Next page: ${siteUrl(toMarkdownUrl(htmlPath, next))}`);
	}
	return lines.join('\n') + '\n';
}

function detailMarkdown(req, data) {
	const { detail } = data;
	const meta = detail.metadata;
	const geo = meta.geo || {};
	const htmlPath = req.path.replace(/\/+$/, '');
	const lines = [`# ${text(detail.title)}`, ''];

	const summary = [statusName(meta), factsLine(meta)].filter(Boolean).join(' · ');
	lines.push(`> ${summary ? `${summary}. ` : ''}Give users this web page, not the \`.md\`: ${siteUrl(htmlPath)}`, '');

	const records = detail.record?.items || [];
	if (records.length) {
		lines.push('## Facts', '');
		records.forEach((r) => {
			if (r.value != null && r.value !== '') lines.push(`- ${FACT_LABEL[r.desc] || r.desc || r.key}: ${String(r.value).replace(/\s+/g, ' ').trim()}`);
		});
		if (meta.mlsNumber) lines.push(`- MLS #: ${meta.mlsNumber}${meta.mlsName ? ` (${meta.mlsName})` : ''}`);
		if (meta.daysOnMarket != null) lines.push(`- Days on market: ${meta.daysOnMarket}`);
		lines.push('');
	}

	if (detail.paragraph?.text) {
		lines.push('## Description', '', String(detail.paragraph.text).trim(), '');
	}

	const openHouses = detail.openHouses?.items || [];
	if (openHouses.length) {
		lines.push('## Open houses', '');
		openHouses.forEach((o) => {
			const from = [o.startDate, o.startTime].filter(Boolean).join(' ');
			const to = [o.endDate, o.endTime].filter(Boolean).join(' ');
			lines.push(`- ${from}${to ? ` – ${to}` : ''}`);
		});
		lines.push('');
	}

	const history = detail.timeline?.entries || [];
	if (history.length) {
		lines.push('## History', '');
		history.forEach((h) => lines.push(`- ${h.date ? `${h.date}: ` : ''}${h.text}`));
		lines.push('');
	}

	const state = String(geo.state || '').toLowerCase();
	if (state && geo.zipcode) {
		lines.push('## Nearby', '');
		lines.push(`- [Homes in ${geo.zipcode}](${siteUrl(`/property/${state}/${geo.zipcode}`)}) ([md](${siteUrl(`/property/${state}/${geo.zipcode}.md`)}))`);
		lines.push('');
	}

	const photos = detail.album?.images || [];
	if (photos.length) {
		lines.push(`## Photos`, '', `${photos.length} photos. First: ${photos[0]}`, '');
	}
	return lines.join('\n').replace(/\n+$/, '') + '\n';
}

/**
 * Send the markdown twin of a property page.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {object} data — `model.data` from the `property` route config
 */
export function sendPropertyMarkdown(req, res, data) {
	const isDetail = Boolean(req.query.prId);
	res.set('Link', `<${siteUrl(req.path.replace(/\/+$/, '') + searchOf(req))}>; rel="canonical"`);
	res.type('text/markdown; charset=utf-8');
	if (isDetail && !data?.detail?.metadata) {
		return res.status(404).send(`# Listing not found\n\nThis listing is gone or the id is wrong. Search the area instead; URL rules: ${siteUrl('/llms.txt')}\n`);
	}
	if (!isDetail && !data?.geo) {
		return res.status(404).send(`# Place not found\n\nNo state, county, city, zip or school matches this path. URL rules: ${siteUrl('/llms.txt')}\n`);
	}
	return res.send(isDetail ? detailMarkdown(req, data) : searchMarkdown(req, data));
}

const LEVEL_TITLE = { elementary: 'Elementary schools', middle: 'Middle schools', high: 'High schools' };

/**
 * `/property/{state}/{city}/schools.md`: schools assigned to homes for sale in a city,
 * best rated first, each with its school-zone search.
 * @param {{ state: string, city: string }} geo
 * @param {{ sampled: number, total: number, schools: object[] }} result — from getCitySchools
 */
export function sendSchoolsMarkdown(req, res, geo, result) {
	const cityPath = req.path.replace(/\/schools\.md$/i, '');
	res.type('text/markdown; charset=utf-8');
	const lines = [`# Schools for homes in ${placeName(geo)}`, ''];
	lines.push(
		`> Schools assigned to ${formatNumber(result.sampled)} of the ${formatNumber(result.total)} homes for sale in ${placeName(geo)}, ` +
			'best rated first. Rating is GreatSchools 1–10. Each school links a search of homes for sale in its attendance zone; ' +
			'give users that link, or a home from its `.md` results. Assignments can change; buyers should confirm with the district.',
		'',
		`All homes in the city: ${siteUrl(cityPath)} ([md](${siteUrl(`${cityPath}.md`)}))`,
		'',
	);
	if (!result.schools.length) {
		lines.push('No school data for this city right now.');
		return res.send(lines.join('\n') + '\n');
	}
	for (const level of ['elementary', 'middle', 'high']) {
		const rows = result.schools.filter((s) => s.levels.includes(level));
		if (!rows.length) continue;
		lines.push(`## ${LEVEL_TITLE[level]}`, '');
		rows.forEach((s, i) => {
			const city = s.city?.state === geo.state.toLowerCase() ? s.city.city : cityPath.split('/').pop();
			const zone = `/property/${geo.state.toLowerCase()}/${city}/${s.id}_school`;
			const facts = [
				s.rating != null ? `rating ${s.rating}/10` : 'not rated',
				s.type,
				s.grades && `grades ${s.grades}`,
				`${s.homes} sampled home${s.homes === 1 ? '' : 's'} for sale in zone`,
			]
				.filter(Boolean)
				.join(' · ');
			lines.push(`${i + 1}. [${text(s.name)}](${siteUrl(zone)}) — ${facts} ([md](${siteUrl(`${zone}.md`)}))`);
		});
		lines.push('');
	}
	return res.send(lines.join('\n').replace(/\n+$/, '') + '\n');
}

/** `[Name](web page) ([md](twin))`: the web page is what users get, the twin is for reading. */
function searchLink(name, path) {
	return `[${name}](${siteUrl(path)}) ([md](${siteUrl(`${path}.md`)}))`;
}

/**
 * Sitemap link → markdown line. Each place links its home search web page first, so an
 * agent that answers by copying links hands users the page, not the `.md` twin; the
 * sitemap's own browse links (`.md`) follow, so any search is reachable by following links.
 */
function sitemapLine({ href, text: label }) {
	const path = String(href || '').replace(/^https?:\/\/[^/]+/, '');
	const name = text(label);
	let m;
	if ((m = path.match(/^\/property\/sitemap\/([a-z]{2})$/i))) {
		return `- ${searchLink(name, `/property/${m[1]}`)} · counties: ${siteUrl(`${path}.md`)}`;
	}
	if ((m = path.match(/^\/property\/sitemap\/([a-z]{2})\/([^/]+_county)$/i))) {
		return `- ${searchLink(name, `/property/${m[1]}/${m[2]}`)} · cities: ${siteUrl(`${path}.md`)}`;
	}
	if ((m = path.match(/^\/property\/sitemap\/([a-z]{2})\/([^/]+)$/i))) {
		const city = `/property/${m[1]}/${m[2]}`;
		return `- ${searchLink(name, city)} · schools: ${siteUrl(`${city}/schools.md`)} · zips and neighborhoods: ${siteUrl(`${path}.md`)}`;
	}
	if (path.startsWith('/property/')) {
		return `- ${searchLink(name, path)}`;
	}
	return null;
}

/**
 * `/property/sitemap.md` and below: the sitemap's links as a markdown list.
 * @param {object} data — model.data from a property-sitemap* route config
 */
export function sendSitemapMarkdown(req, res, data) {
	res.type('text/markdown; charset=utf-8');
	const links = (data?.linksComponent?.data || []).map(sitemapLine).filter(Boolean);
	const lines = [
		`# ${text(data?.title || 'Sitemap')}`,
		'',
		'> Each place links its homes-for-sale web page; read its listings from the `md` link. ' +
			'Give users the web page, never a `.md` URL, with their filters as query parameters, e.g. ' +
			`${siteUrl('/property/tx/austin?bed=3_&bath=2_&price=_500000')}. URL rules: ${siteUrl('/llms.txt')}`,
		'',
		...links,
	];
	return res.send(lines.join('\n') + '\n');
}
