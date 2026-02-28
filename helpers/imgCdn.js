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
 * @param {string} imagePath - Path relative to assets/images (e.g. 'welcome/point0.jpeg' or 'point0.jpeg')
 * @returns {string} Full URL, e.g. `${cdnHost}/images/welcome/point0.jpeg`
 */
export function getImgCdnUrl(cdnHost, imagePath) {
	const base = cdnHost || '';
	const cleanPath = imagePath.replace(/^\//, ''); // Remove leading slash if present
	return `${base}/images/${cleanPath}`;
}

/** Known welcome images: basename → full path relative to assets/images (used by EJS comps) */
export const WELCOME_IMG = {
	point0: 'welcome/point0.jpeg',
	point1: 'welcome/point1.jpeg',
	point2: 'welcome/point2.jpeg',
	point3: 'welcome/point3.jpeg',
};
