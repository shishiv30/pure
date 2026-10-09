/**
 * Prefix root-relative URLs in static HTML for subpath deployments (e.g. GitHub Pages /pure/).
 * Skips protocol-relative (//) and absolute (http:) URLs.
 * @param {string} html
 * @param {string} basePath - e.g. "/pure" (no trailing slash)
 * @returns {string}
 */
export function prefixRootRelativeUrls(html, basePath) {
	if (!html || !basePath) return html;
	const base = (basePath.startsWith('/') ? basePath : `/${basePath}`).replace(/\/$/, '');
	return html.replace(
		/(\s(?:href|src|content|action)=["'])\/(?!\/)/gi,
		`$1${base}/`,
	);
}

/**
 * Pathname segment from a full host URL (https://host/pure → /pure).
 * @param {string} hostUrl
 * @returns {string}
 */
export function pathnameFromHostUrl(hostUrl) {
	if (!hostUrl || !/^https?:\/\//i.test(hostUrl)) return '';
	try {
		const { pathname } = new URL(hostUrl);
		if (!pathname || pathname === '/') return '';
		return pathname.replace(/\/$/, '');
	} catch {
		return '';
	}
}

/**
 * Site base from webpack publicPath (`/` → '', `https://host/pure/` → `/pure`).
 * @param {string} publicPath
 * @returns {string}
 */
export function appBaseFromPublicPath(publicPath) {
	if (!publicPath || publicPath === '/') return '';
	if (publicPath.startsWith('/')) {
		const pathOnly = publicPath.replace(/\/$/, '');
		return pathOnly === '' ? '' : pathOnly;
	}
	return pathnameFromHostUrl(String(publicPath).replace(/\/$/, ''));
}

/**
 * Drop a deploy base so route regexes stay rooted at `/demo/...`.
 * `/pure/demo/tx` + `/pure` → `/demo/tx`. Unknown bases are left unchanged.
 * @param {string} pathname
 * @param {string} base
 * @returns {string}
 */
export function stripAppBase(pathname, base) {
	if (!pathname || !base || base === '/') return pathname || '';
	const normalized = (base.startsWith('/') ? base : `/${base}`).replace(/\/$/, '');
	if (pathname === normalized) return '/';
	if (pathname.startsWith(`${normalized}/`)) {
		return pathname.slice(normalized.length);
	}
	return pathname;
}

/**
 * Put the deploy base back on an app path for history and hrefs.
 * Paths that already include the base are unchanged.
 * @param {string} pathname
 * @param {string} base
 * @returns {string}
 */
export function withAppBase(pathname, base) {
	if (!pathname || !base || base === '/') return pathname || '';
	const normalized = (base.startsWith('/') ? base : `/${base}`).replace(/\/$/, '');
	if (pathname === normalized || pathname.startsWith(`${normalized}/`)) {
		return pathname;
	}
	if (!pathname.startsWith('/')) return pathname;
	return `${normalized}${pathname}`;
}
