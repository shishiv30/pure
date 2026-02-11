import config from '../config.js';
import { getImgCdnUrl } from '../../helpers/imgCdn.js';

const APP_URL = config.appUrl || '';
const CDN_URL = (config.cdnUrl || '').replace(/\/$/, '');

const COMPONENT_NAME = 'gallery';
const COMPONENT_TEMPLATE = 'comp_gallery';

// Hardcoded list of background images with metadata
const bgImages = [
	{
		path: 'bg/01.jpeg',
		title: 'Image 01',
		description: 'First image in the gallery',
		index: 1,
	},
	{
		path: 'bg/02.jpeg',
		title: 'Image 02',
		description: 'Second image in the gallery',
		index: 2,
	},
	{
		path: 'bg/03.jpeg',
		title: 'Image 03',
		description: 'Third image in the gallery',
		index: 3,
	},
	{
		path: 'bg/04.jpeg',
		title: 'Image 04',
		description: 'Fourth image in the gallery',
		index: 4,
	},
	{
		path: 'bg/05.jpeg',
		title: 'Image 05',
		description: 'Fifth image in the gallery',
		index: 5,
	},
	{
		path: 'bg/06.jpeg',
		title: 'Image 06',
		description: 'Sixth image in the gallery',
		index: 6,
	},
	{
		path: 'bg/07.jpeg',
		title: 'Image 07',
		description: 'Seventh image in the gallery',
		index: 7,
	},
	{
		path: 'bg/08.jpeg',
		title: 'Image 08',
		description: 'Eighth image in the gallery',
		index: 8,
	},
];

const galleryData = {
	title: 'Gallery',
	// Array of image URLs for the album plugin (data-images attribute)
	images: bgImages.map((img) => getImgCdnUrl(CDN_URL, img.path)),
	// Array of image metadata for display in overlay
	imagesMeta: bgImages.map((img) => ({
		title: img.title,
		description: img.description,
		index: img.index,
	})),
	initialIndex: 0,
	alt: 'Pure UI background gallery',
};

/**
 * Create the gallery UI component config.
 * @returns {{ name: string, template: string, data: object }}
 */
export function createGalleryComponent() {
	return {
		name: COMPONENT_NAME,
		template: COMPONENT_TEMPLATE,
		data: galleryData,
	};
}
