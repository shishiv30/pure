import BaseController from '../controllers/index.js';
import {
	createPropertySpaRegExp,
	PROPERTY_SPA_ROUTES,
} from '../../helpers/routes/propertySpaRoutes.js';
import {
	appendPreservedQuery,
	getCanonicalPropertyGeoRedirectPath,
} from '../utils/propertyGeoRedirect.js';

function applyDetailQuery(req) {
	req.query.geoPath = `${req.params[0]}/${req.params[1]}`;
	req.query.prId = req.params[PROPERTY_SPA_ROUTES.detail.prIdParamIndex];
}

function handlePropertyRoute(controller, res) {
	return (async () => {
		try {
			const model = await controller.get();
			if (model && model.code === 500) {
				console.error('Property get failed:', model.error);
				res.status(500).send('Unable to load this page. Please try again later.');
				return;
			}
			await controller.toPage(model);
		} catch (err) {
			console.error('Property route error:', err);
			res.status(500).send('Unable to load this page. Please try again later.');
		}
	})();
}

export default function registerProperty(router) {
	router.get(/^\/demo(\/.*)?$/, (req, res) => {
		const rest = req.params[0] || '';
		const target = rest && rest !== '/' ? `/property${rest}` : '/property/sitemap';
		res.redirect(301, appendPreservedQuery(req, target));
	});

	router.get(/^\/property\/?$/, (req, res) => {
		res.redirect(301, '/property/sitemap');
	});

	router.get(/^\/property\/sitemap\/?$/, async (req, res) => {
		await handlePropertyRoute(new BaseController(req, res, 'property-sitemap'), res);
	});

	router.get(/^\/property\/sitemap\/([a-z]{2})\/?$/, async (req, res) => {
		await handlePropertyRoute(
			new BaseController(req, res, 'property-sitemap-state'),
			res,
		);
	});

	router.get(
		/^\/property\/sitemap\/([a-z]{2})\/([^\/]+)_county\/?$/,
		async (req, res) => {
			await handlePropertyRoute(
				new BaseController(req, res, 'property-sitemap-county'),
				res,
			);
		},
	);

	router.get(/^\/property\/sitemap\/([a-z]{2})\/([^\/]+)\/?$/, async (req, res) => {
		await handlePropertyRoute(
			new BaseController(req, res, 'property-sitemap-city'),
			res,
		);
	});

	router.get(createPropertySpaRegExp('detail'), async (req, res) => {
		applyDetailQuery(req);
		await handlePropertyRoute(new BaseController(req, res, 'property'), res);
	});

	router.get(createPropertySpaRegExp('geo'), async (req, res) => {
		const tail = req.params[0] ?? '';
		const canonical = getCanonicalPropertyGeoRedirectPath(tail);
		if (canonical) {
			const currentPathOnly = req.path.replace(/\/+$/, '') || '/';
			const targetPathOnly = canonical.replace(/\/+$/, '') || '/';
			if (currentPathOnly !== targetPathOnly) {
				res.redirect(301, appendPreservedQuery(req, canonical));
				return;
			}
		}

		req.query.geoPath = tail;
		await handlePropertyRoute(new BaseController(req, res, 'property'), res);
	});
}
