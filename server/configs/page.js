import { createHeaderComponent } from '../ejs/comp_header.js';
import { createFooterComponent } from '../ejs/comp_footer.js';
import { getPageData, getComps, getCompByKey } from '../utils/cmsData.js';

// Shared page handler logic: uses cmsData utility (config.cmsHealth → API, else data/)
async function handlePageGet(key) {
	const fallback = () => ({
		headerComponent: createHeaderComponent(),
		footerComponent: createFooterComponent(),
		theme: null,
		pageContent: null,
		sections: null,
	});

	const comps = await getComps(['header', 'footer']);
	const { header: headerData, footer: footerData } = comps;

	const headerComponent = createHeaderComponent(headerData ?? undefined);
	const footerComponent = createFooterComponent(footerData ?? undefined);

	const pageResult = await getPageData(key);
	if (!pageResult?.data) {
		console.error('Failed to load page data for:', key);
		return fallback();
	}

	try {
		const sections = pageResult.data;
		const meta = pageResult.meta ?? undefined;
		const themeKey = typeof meta?.theme === 'string' ? meta.theme.trim() : '';
		const theme = themeKey ? await getCompByKey(themeKey) : undefined;
		return {
			headerComponent,
			footerComponent,
			sections,
			meta,
			...(theme != null && { theme }),
		};
	} catch (err) {
		console.error('Failed to build page sections for:', key, err);
		return fallback();
	}
}

function seoFromModel(req, model) {
	const m = model?.data?.meta;
	return { title: m?.title ?? '', desc: m?.desc ?? '', keywords: m?.keywords ?? '' };
}

// Index (route /) – same logic as page, fixed key
export const indexConfig = {
	name: 'index',
	assetName: 'index',
	async seo(req, model) {
		return seoFromModel(req, model);
	},
	get: async () => handlePageGet('index'),
};

// Dynamic page config (route /page/:key)
export default {
	name: 'page',
	assetName: 'index',
	async seo(req, model) {
		return seoFromModel(req, model);
	},
	beforeGet(req) {
		return { key: req.params?.key || 'index' };
	},
	get: async (payload) => {
		if (!payload.key) return null;
		return handlePageGet(payload.key);
	},
};
