/**
 * CDN image URL helper.
 * Images are copied to dist/images/ preserving folder structure from client/assets/images.
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
	if(!imagePath.startsWith('/')) {
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
