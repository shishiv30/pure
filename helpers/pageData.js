import { getImgCdnUrl } from './imgCdn.js';

/**
 * Section keys in page render order (hero → scrollview → points → gallery → timeline).
 */
export const PAGE_SECTIONS_ORDER = ['hero', 'scrollview', 'points', 'gallery', 'timeline'];

/**
 * Convert page data array (in PAGE_SECTIONS_ORDER) to keyed object for resolvePageData/buildSections.
 * @param {Array} arr - Section data in render order [hero, scrollview, points, gallery, timeline]
 * @returns {object} { hero, scrollview, points, gallery, timeline }
 */
export function arrayToPageData(arr) {
	if (!Array.isArray(arr)) return arr;
	const out = {};
	PAGE_SECTIONS_ORDER.forEach((key, i) => {
		if (arr[i] != null) out[key] = arr[i];
	});
	return out;
}

/**
 * Resolve relative image paths and link paths in raw page data.
 * @param {object} raw - { hero, gallery, points, scrollview, timeline }
 * @param {{ cdnUrl: string, appUrl: string }} config
 * @returns {object} Resolved { hero, gallery, points, scrollview, timeline }
 */
export function resolvePageData(raw, config) {
	const { cdnUrl = '', appUrl = '' } = config;
	const base = (appUrl || '').replace(/\/$/, '');
	const cdn = (cdnUrl || '').replace(/\/$/, '');

	const hero = raw.hero && {
		...raw.hero,
		image: raw.hero.image && {
			...raw.hero.image,
			src: raw.hero.image.src && cdn
				? getImgCdnUrl(cdn, raw.hero.image.src)
				: raw.hero.image.src,
		},
	};

	const gallery = raw.gallery && {
		...raw.gallery,
		images: (raw.gallery.imagesMeta || []).map((m) =>
			cdn ? getImgCdnUrl(cdn, m.path) : m.path,
		),
		imagesMeta: (raw.gallery.imagesMeta || []).map((m) => ({
			title: m.title,
			description: m.description,
			index: m.index,
		})),
	};

	const points = raw.points && {
		...raw.points,
		items: (raw.points.items || []).map((item) => ({
			...item,
			ctaHref: item.ctaHref
				? `${base}${item.ctaHref.startsWith('/') ? '' : '/'}${item.ctaHref}`
				: item.ctaHref,
			image: item.image && {
				...item.image,
				src: item.image.src && cdn
					? getImgCdnUrl(cdn, item.image.src)
					: item.image.src,
			},
		})),
	};

	const scrollview = raw.scrollview && {
		...raw.scrollview,
		links: (raw.scrollview.links || []).map((link) => ({
			...link,
			href: link.href
				? `${base}${link.href.startsWith('/') ? '' : '/'}${link.href}`
				: link.href,
		})),
	};

	const timeline = raw.timeline || null;

	return { hero, gallery, points, scrollview, timeline };
}

/**
 * Build sections array in page render order from resolved data and component creators.
 * @param {object} resolved - Output of resolvePageData
 * @param {object} creators - Map of section key to create function (e.g. { hero: createHeroComponent, ... })
 * @returns {Array} Sections array in PAGE_SECTIONS_ORDER
 */
export function buildSections(resolved, creators) {
	return PAGE_SECTIONS_ORDER.map((key) => {
		const create = creators[key];
		const data = resolved[key];
		return create && data ? create(data) : null;
	}).filter(Boolean);
}
