import { getStatesForSitemap } from '../../helpers/geo.js';
import { createHeaderComponent } from '../ejs/comp_header.js';
import { createFooterComponent } from '../ejs/comp_footer.js';
import { createLinksComponent } from '../ejs/comp_links.js';
import config from '../config.js';

const SITEMAP_BASE = '/demo/sitemap';

export default {
	name: 'demo-sitemap',
	assetName: 'demo',
	seo: function (req, model) {
		const title = model?.data?.title || 'States Sitemap';
		return {
			title,
			desc: 'Browse all states.',
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
				{ text: 'Home', href: '/demo' },
				{ text: 'Sitemap', href: '' },
			],
		};

		return {
			title: 'States Sitemap',
			breadcrumb,
			headerComponent,
			footerComponent,
			linksComponent,
		};
	},
};
