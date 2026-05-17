/**
 * URL helpers: attach hosts to path-only values (no path-format conversion).
 * Use appHost/cdnHost + stored path to build href/src for EJS and components.
 * For converting between path formats (e.g. geo slug vs SOA), use helpers/path.js.
 *
 * Definitions (DB + data files use path; render time builds href/src):
 * - path: path-only, no domain, always starts with "/" (e.g. /welcome/point0.jpeg, /demo/ny/new-york).
 *         Stored in DB and data/; used for images and links.
 * - href: full URL with domain for <a> links (e.g. https://example.com/demo/ny). Built at render
 *         from appHost + path. Use getHref(item) to resolve.
 * - src:  full URL with domain for <img> (e.g. https://cdn.example.com/images/welcome/point0.jpeg).
 *         Built at render via getImgCdnUrl(cdnHost, path). Use getSrc(img) to resolve.
 *
 * CDN images are copied to dist/images/ preserving folder structure from client/assets/images.
 * webpack.config.base.js: images/[path relative to assets/images][name][ext]
 * So e.g. client/assets/images/welcome/point0.jpeg → dist/images/welcome/point0.jpeg
 * Usage: ${cdnHost}/images/welcome/point0.jpeg
 */

/**
 * Build CDN host URL for an image from its path relative to client/assets/images.
 * @param {string} cdnHost - Base host (e.g. config.cdnHost)
 * @param {string} imagePath - Path starting with "/" (e.g. '/welcome/point0.jpeg'); leading slash is stripped when building URL
 * @returns {string} Full URL, e.g. `${cdnHost}/images/welcome/point0.jpeg`
 */
export function getImgCdnUrl(cdnHost, imagePath) {
	const base = cdnHost ? `${cdnHost}/images` : '/images';
	if (!imagePath.startsWith('/')) {
		imagePath = `/${imagePath}`;
	}
	return imagePath ? `${base}${imagePath}` : '';
}

/** Known welcome images: basename → path starting with "/" (used by EJS comps and callers of getImgCdnUrl) */
export const WELCOME_IMG = {
	point0: '/welcome/point0.jpeg',
	point1: '/welcome/point1.jpeg',
	point2: '/welcome/point2.jpeg',
	point3: '/welcome/point3.jpeg',
};

/**
 * Build href for <a> from link/item.
 * Uses href if present, else appHost + path.
 * If item.id exists, append "?id=<id>" (or "&id=<id>" when query already present).
 * @param {object} item - { href?, path?, id? }
 * @param {string} appHost - Base app host (no trailing slash)
 * @returns {string}
 */
export function getHref(item, appHost = '') {
	if (item == null) return '';
	let url = '';
	if (item.href) {
		url = item.href;
	} else if (item.path) {
		url = `${appHost}${item.path}`;
	}
	if (!url) return '';
	if (!item.id) return url;
	const separator = url.includes('?') ? '&' : '?';
	return `${url}${separator}id=${encodeURIComponent(item.id)}`;
}

/**
 * Build src for <img> from image object or pre-built URL string.
 * Uses src if present, else getImgCdnUrl(cdnHost, path).
 * @param {object|string} img - { src?, path? } or full URL string
 * @param {string} cdnHost - Base CDN host (no trailing slash)
 * @returns {string}
 */
export function getSrc(img, cdnHost = '') {
	if (img == null) return '';
	if (typeof img === 'string') return img;
	if (img.src) return img.src;
	if (img.path) return getImgCdnUrl(cdnHost, img.path);
	return '';
}
