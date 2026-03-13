import { fetchStatesFromGeoarea } from '../configs/realestate.js';
import { mapSoaStatesResponse } from '../../helpers/soaGeoMapper.js';
import { createHeaderComponent } from '../ejs/comp_header.js';
import { createFooterComponent } from '../ejs/comp_footer.js';
import { createLinksComponent } from '../ejs/comp_links.js';
import { getStateFullName } from '../../helpers/stateDict.js';
import { getStatesForSitemap } from '../../helpers/geo.js';

const SITEMAP_BASE = '/sitemap';

function geoToLink(geo, base, textOverride) {
	if (!geo || !geo.path) return null;
	const href = `${base}/${geo.path}`;
	const text = textOverride || geo.state || geo.path;
	return { text, href };
}

export default {
	name: 'sitemap',
	assetName: 'demo',
	seo() {
		return {
			title: 'States Sitemap',
			desc: 'Browse all states.',
			keywords: 'sitemap, states',
		};
	},
	get: async function () {
		const raw = await fetchStatesFromGeoarea();
		let linksComponent;
		if (!raw || (Array.isArray(raw) && raw.length === 0)) {
			const stateLinks = getStatesForSitemap(SITEMAP_BASE);
			linksComponent = createLinksComponent(stateLinks);
		} else {
			const states = mapSoaStatesResponse(raw) || [];
			const stateLinks = states
				.map((g) => geoToLink(g, SITEMAP_BASE, getStateFullName(g.state) || g.state))
				.filter(Boolean);
			linksComponent = createLinksComponent(stateLinks);
		}
		const headerComponent = createHeaderComponent();
		const footerComponent = createFooterComponent();
		const breadcrumb = {
			links: [
				{ text: 'Home', href: '/' },
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
