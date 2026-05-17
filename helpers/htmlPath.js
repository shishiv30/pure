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
