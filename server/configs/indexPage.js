import { createHeaderComponent } from '../ejs/comp_header.js';
import { createFooterComponent } from '../ejs/comp_footer.js';
import { createHeroComponent } from '../ejs/comp_hero.js';
import { createGalleryComponent } from '../ejs/comp_gallery.js';
import { createPointsComponent } from '../ejs/comp_points.js';
import { createScrollviewComponent } from '../ejs/comp_scrollview.js';
import { createTimelineComponent } from '../ejs/comp_timeline.js';

export default {
	name: 'index',
	seo: function () {
		return {
			title: 'Pure Home',
			desc: 'Author: Conjee Zou, UI solution, Category: Home',
			keywords: '',
		};
	},
	get: async function () {
		const headerComponent = createHeaderComponent();
		const footerComponent = createFooterComponent();
		const heroComponent = createHeroComponent();
		const galleryComponent = createGalleryComponent();
		const pointsComponent = createPointsComponent();
		const scrollviewComponent = createScrollviewComponent();
		const timelineComponent = createTimelineComponent();

		// Sections array for looping in template
		const sections = [
			heroComponent,
			scrollviewComponent,
			pointsComponent,
			galleryComponent,
			timelineComponent,
		];

		return {
			headerComponent,
			footerComponent,
			sections,
		};
	},
};
