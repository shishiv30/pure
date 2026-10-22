import { getStatesForSitemap } from '../../helpers/geo.js';
import { createHeaderComponent } from '../ejs/comp_header.js';
import { createFooterComponent } from '../ejs/comp_footer.js';
import { createLinksComponent } from '../ejs/comp_links.js';
import config from '../config.js';

const SITEMAP_BASE = '/property/sitemap';

export default {
	name: 'property-sitemap',
	assetName: 'property',
	seo: function (req, model) {
		return {
			title: 'Homes for sale by state | Pure',
			desc: model?.data?.intro || 'Browse all states.',
			keywords: 'sitemap, states',
		};
	},
	get: async function () {
		const stateLinks = getStatesForSitemap(SITEMAP_BASE);
		const linksComponent = createLinksComponent(stateLinks);
		const headerComponent = createHeaderComponent();
		const footerComponent = createFooterComponent();

		const breadcrumb = {
			links: [
				{ text: 'Home', href: '/property' },
				{ text: 'Sitemap', href: '' },
			],
		};

		return {
			title: 'States Sitemap',
			intro: 'Pure lists homes for sale, sold homes and rentals across the US from MLS listings. Pick a state to browse its counties and cities, or search any place at /property/{state}/{city}.',
			breadcrumb,
			headerComponent,
			footerComponent,
			linksComponent,
		};
	},
};
