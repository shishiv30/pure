import BaseController from '../controllers/index.js';
import {
	createPropertySpaRegExp,
	PROPERTY_SPA_ROUTES,
} from '../../helpers/routes/propertySpaRoutes.js';
import {
	appendPreservedQuery,
	getCanonicalPropertyGeoRedirectPath,
} from '../utils/propertyGeoRedirect.js';
import {
	sendPropertyMarkdown,
	sendSchoolsMarkdown,
	sendSitemapMarkdown,
	stripMarkdownExt,
	toMarkdownUrl,
} from '../utils/propertyMarkdown.js';
import { getCitySchools } from '../utils/citySchools.js';
import { getGeoByPath } from '../../helpers/geo.js';

function applyDetailQuery(req) {
	req.query.geoPath = `${req.params[0]}/${req.params[1]}`;
	req.query.prId = req.params[PROPERTY_SPA_ROUTES.detail.prIdParamIndex];
}

function handlePropertyRoute(controller, res, { markdownTwin = false } = {}) {
	const req = controller.req;
	return (async () => {
		try {
			const model = await controller.get();
			if (model && model.code === 500) {
				console.error('Property get failed:', model.error);
				res.status(500).send('Unable to load this page. Please try again later.');
				return;
			}
			if (req.markdown) {
				if (controller.config.name.startsWith('property-sitemap')) {
					sendSitemapMarkdown(req, res, model.data);
				} else {
					sendPropertyMarkdown(req, res, model.data);
				}
				return;
			}
			if (markdownTwin) {
				const q = req.url.indexOf('?');
				res.locals.markdownUrl = toMarkdownUrl(req.path, q >= 0 ? req.url.slice(q) : '');
				res.append('Link', `<${res.locals.markdownUrl}>; rel="alternate"; type="text/markdown"`);
			}
			await controller.toPage(model);
		} catch (err) {
			console.error('Property route error:', err);
			res.status(500).send('Unable to load this page. Please try again later.');
		}
	})();
}

export default function registerProperty(router) {
	// Markdown only: schools assigned to a city's homes for sale, with school-zone searches.
	router.get(/^\/property\/([a-z]{2})\/([^/]+)\/schools\.md$/i, async (req, res) => {
		const geo = getGeoByPath(`${req.params[0]}/${req.params[1]}`.toLowerCase());
		if (!geo || geo.type !== 'city') {
			res.status(404).type('text/markdown; charset=utf-8').send('# City not found\n\nUse a city path, e.g. /property/tx/round-rock/schools.md\n');
			return;
		}
		try {
			sendSchoolsMarkdown(req, res, geo, await getCitySchools(geo));
		} catch (err) {
			console.error('City schools error:', err);
			res.status(503).set('Retry-After', '60').type('text').send('School data is unavailable right now. Try again in a minute.\n');
		}
	});

	// Markdown twin (llmstxt.org): `/property/tx/austin.md` → the same route as
	// `/property/tx/austin`, rendered as markdown. Search, detail and sitemap pages.
	router.get(/^\/property\/.+\.md$/i, (req, res, next) => {
		const q = req.url.indexOf('?');
		req.markdown = true;
		req.url = stripMarkdownExt(req.path) + (q >= 0 ? req.url.slice(q) : '');
		next();
	});

	router.get(/^\/demo(\/.*)?$/, (req, res) => {
		const rest = req.params[0] || '';
		const target = rest && rest !== '/' ? `/property${rest}` : '/property/sitemap';
		res.redirect(301, appendPreservedQuery(req, target));
	});

	router.get(/^\/property\/?$/, (req, res) => {
		res.redirect(301, '/property/sitemap');
	});

	router.get(/^\/property\/sitemap\/?$/, async (req, res) => {
		await handlePropertyRoute(new BaseController(req, res, 'property-sitemap'), res, { markdownTwin: true });
	});

	router.get(/^\/property\/sitemap\/([a-z]{2})\/?$/, async (req, res) => {
		await handlePropertyRoute(
			new BaseController(req, res, 'property-sitemap-state'),
			res, { markdownTwin: true });
	});

	router.get(
		/^\/property\/sitemap\/([a-z]{2})\/([^\/]+)_county\/?$/,
		async (req, res) => {
			await handlePropertyRoute(
				new BaseController(req, res, 'property-sitemap-county'),
				res, { markdownTwin: true });
		},
	);

	router.get(/^\/property\/sitemap\/([a-z]{2})\/([^\/]+)\/?$/, async (req, res) => {
		await handlePropertyRoute(
			new BaseController(req, res, 'property-sitemap-city'),
			res, { markdownTwin: true });
	});

	router.get(createPropertySpaRegExp('detail'), async (req, res) => {
		applyDetailQuery(req);
		await handlePropertyRoute(new BaseController(req, res, 'property'), res, { markdownTwin: true });
	});

	router.get(createPropertySpaRegExp('geo'), async (req, res) => {
		const tail = req.params[0] ?? '';
		const canonical = getCanonicalPropertyGeoRedirectPath(tail);
		if (canonical) {
			const currentPathOnly = req.path.replace(/\/+$/, '') || '/';
			const targetPathOnly = canonical.replace(/\/+$/, '') || '/';
			if (currentPathOnly !== targetPathOnly) {
				const target = req.markdown ? toMarkdownUrl(canonical) : canonical;
				res.redirect(301, appendPreservedQuery(req, target));
				return;
			}
		}

		req.query.geoPath = tail;
		await handlePropertyRoute(new BaseController(req, res, 'property'), res, { markdownTwin: true });
	});
}
