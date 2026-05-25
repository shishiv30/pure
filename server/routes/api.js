import express from 'express';
const router = express.Router();
import BaseController from '../controllers/index.js';
import { fetchPropertiesImagesFromSOA } from '../controllers/demo.js';
import { getGeoByPath } from '../../helpers/geo.js';
import { mapSOADataListToArticles } from '../../helpers/article.js';
import { searchHouse } from './api.soa.property.js';

/**
 * @swagger
 * /geo:
 *   get:
 *     summary: Search geo information
 *     description: Search geo information by text and type.
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [state, city, county, zipcode, neighborhood]
 *         examples:
 *           type:
 *             summary: Type of geo information
 *             value: city
 *             description: Type of geo information
 *         description: Type of geo information
 *       - in: query
 *         name: text
 *         schema:
 *           type: string
 *         examples:
 *           text:
 *             summary: Search text
 *             value: round rock
 *             description: Search text for the geo information
 *         description: Search text
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           default: 10
 *         examples:
 *           size:
 *             summary: Number of results
 *             value: 10
 *             description: Number of results
 *         description: Number of results
 *     responses:
 *       200:
 *         description: A list of geo information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         example: city
 *                       city:
 *                         type: string
 *                         example: Dallas
 *                       path:
 *                         type: string
 *                         example: tx/dallas
 *                       county:
 *                         type: string
 *                         example: Dallas
 *                       state:
 *                         type: string
 *                         example: TX
 *                       lat:
 *                         type: string
 *                         example: 32.7935
 *                       lng:
 *                         type: string
 *                         example: -96.7667
 *                       population:
 *                         type: string
 *                         example: 5830932
 *                 cost:
 *                   type: integer
 *                   example: 58
 *     tags:
 *       - Geo
 */
router.get('/geo', async (req, res) => {
	//get current router is get or post or put or delete
	let controller = new BaseController(req, res, 'geo');
	let result = await controller.get();
	controller.toData(result);
});

/**
 * @swagger
 * /demo/detail/{prId}:
 *   get:
 *     summary: Demo property detail (JSON)
 *     description: Same data as the demo HTML detail page for SPA clients.
 *     parameters:
 *       - in: path
 *         name: prId
 *         required: true
 *         schema:
 *           type: string
 *           example: "45a6f0ff-21ec-45f6-8a35-69de1bc9368d"
 *         description: MLS public record id (`mlsPublicRecordAssociation.id`; same as third segment of /demo/detail/{state}/{zip}/{prId})
 *     responses:
 *       200:
 *         description: BaseController JSON envelope
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   description: Demo page model (detail, nearbyArticleComponent, seo, etc.)
 *                 error:
 *                   type: string
 *                   nullable: true
 *                 cost:
 *                   type: integer
 *       500:
 *         description: Server error
 *     tags:
 *       - Demo
 */
router.get('/demo/detail/:prId', async (req, res) => {
	req.query.prId = req.params.prId;
	const controller = new BaseController(req, res, 'demo');
	const result = await controller.get();
	controller.toData(result);
});

/**
 * @swagger
 * /demo/search/{path}:
 *   get:
 *     summary: Demo property search by geo path (JSON)
 *     description: |
 *       Resolves a Pure geo path via `getGeoByPath`, searches nearby listings through SOA
 *       (`searchHouse`), and returns article cards for the demo SPA (`mapSOADataListToArticles`).
 *       Same listing data as the demo HTML search page; path uses our geo format (not SOA slugs).
 *     parameters:
 *       - in: path
 *         name: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Geographic location path in Pure geo format
 *         examples:
 *           state:
 *             summary: State
 *             value: tx
 *           city:
 *             summary: City
 *             value: tx/round-rock
 *           county:
 *             summary: County
 *             value: tx/williamson_county
 *           zipcode:
 *             summary: Zipcode
 *             value: tx/78664
 *           neighborhood:
 *             summary: Neighborhood
 *             value: tx/round-rock/old-town_neighborhood
 *     responses:
 *       200:
 *         description: Search results as article cards plus SOA total count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 articles:
 *                   type: array
 *                   description: Property listings mapped to `comp_article` card shape
 *                   items:
 *                     type: object
 *                     properties:
 *                       metadata:
 *                         type: object
 *                         description: SOA Pure metadata from `mapSOADataToMetadata`
 *                       img:
 *                         type: string
 *                         description: First listing photo URL (preview)
 *                         example: "https://pi.movoto.com/p/402/21259416_0_ZjJZN2_p.webp"
 *                       imgTag:
 *                         type: string
 *                         description: Listing office name
 *                         example: "Hunter Ranch and Realty"
 *                       imgAlt:
 *                         type: string
 *                         description: Display address for image alt text
 *                         example: "101 Mel St, Winters, Runnels County, TX 79567"
 *                       title:
 *                         type: string
 *                         description: Display address (same as imgAlt)
 *                         example: "101 Mel St, Winters, Runnels County, TX 79567"
 *                       path:
 *                         type: string
 *                         description: Demo SPA detail route
 *                         example: "/demo/detail/tx/79567/45a6f0ff-21ec-45f6-8a35-69de1bc9368d"
 *                       tags:
 *                         type: array
 *                         description: Status and price-change badges (className/text)
 *                         items:
 *                           type: object
 *                           properties:
 *                             text:
 *                               type: string
 *                               example: "Pending"
 *                             className:
 *                               type: string
 *                               example: "danger"
 *                       attrs:
 *                         type: array
 *                         description: Price, beds, baths, sqft, price per sqft, year built
 *                         items:
 *                           type: object
 *                           properties:
 *                             key:
 *                               type: string
 *                               example: "Est"
 *                             value:
 *                               oneOf:
 *                                 - type: string
 *                                 - type: number
 *                               example: "$135,000"
 *                             desc:
 *                               type: string
 *                               example: "Estimate Price"
 *                 totalCount:
 *                   type: integer
 *                   description: Total listings reported by SOA for this search
 *                   example: 42
 *       400:
 *         description: Geo path could not be resolved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid geo path"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 *     tags:
 *       - Demo
 */
router.get('/demo/search/:path(*)', async (req, res) => {
	try {
		const { path } = req.params;
		const geo = getGeoByPath(path);
		if (!geo) {
			res.status(400).json({ error: 'Invalid geo path' });
			return;
		}
		const nearbyProperties = await searchHouse(geo);
		let articles = [];
		let totalCount = 0;
		if (nearbyProperties && nearbyProperties.listings && nearbyProperties.listings.length > 0) {
			articles =
				mapSOADataListToArticles(nearbyProperties.listings);
			totalCount = nearbyProperties.totalCount;
		}
		res.json({ articles, totalCount });
	} catch (error) {
		console.error('Error fetching properties:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

/**
 * @swagger
 * /demo/{geoPath}:
 *   get:
 *     summary: Demo geo page (JSON)
 *     description: |
 *       Same full page model as the demo HTML route `/demo/{geoPath}` (e.g. `/demo/tx/austin`,
 *       `/demo/tx/78717`). Sets `geoPath` on the demo config; no canonical-path redirect.
 *     parameters:
 *       - in: path
 *         name: geoPath
 *         required: true
 *         schema:
 *           type: string
 *         description: Pure geo path (state, city, zipcode, county, neighborhood, etc.)
 *         examples:
 *           state:
 *             summary: State
 *             value: tx
 *           city:
 *             summary: City
 *             value: tx/austin
 *           zipcode:
 *             summary: Zipcode
 *             value: tx/78717
 *           county:
 *             summary: County
 *             value: tx/williamson_county
 *     responses:
 *       200:
 *         description: BaseController JSON envelope (seo, geo, articleComponent, detail, etc.)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   description: Demo page model from demo config get()
 *                 error:
 *                   type: string
 *                   nullable: true
 *                 cost:
 *                   type: integer
 *       500:
 *         description: Server error
 *     tags:
 *       - Demo
 */
router.get('/demo/:geoPath(*)', async (req, res) => {
	req.query.geoPath = req.params.geoPath;
	const controller = new BaseController(req, res, 'demo');
	const result = await controller.get();
	controller.toData(result);
});

/**
 * @swagger
 * /properties-images/{url}:
 *   get:
 *     summary: Get properties images by url
 *     description: Retrieve property images from SOA API based on url.
 *     parameters:
 *       - in: path
 *         name: url
 *         required: true
 *         examples:
 *           url:
 *             summary: Url encoded
 *             value: austin-tx%2F4831-trail-crest-cir-austin-tx-78735%2Fpid_u0y0bh54nh%2F
 *             description: encoded Url of the property
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of properties images
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *                 properties:
 *                   path:
 *                     type: string
 *                     description: Image path
 *     tags:
 *       - Properties
 */
router.get('/properties-images/:url(*)', async (req, res) => {
	try {
		const { url } = req.params;
		if (!url) {
			throw new Error('Url is required');
		}
		const imageUrls = await fetchPropertiesImagesFromSOA(url);
		res.json(imageUrls);
	} catch (error) {
		console.error('Error fetching properties:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

export default router;
