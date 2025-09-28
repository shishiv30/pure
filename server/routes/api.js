import express from 'express';
const router = express.Router();
import BaseController from '../controllers/basecontroller.js';
import { fetchPropertiesFromSOA, fetchPropertiesImagesFromSOA } from '../configs/demo.js';
import { mapGeoPathToSOAPath } from '../../helpers/geo.js';
import { mapPropertiesToArticles } from '../../helpers/propertyMapper.js';

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
 *             value: round-rock
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
 * /properties/{path}:
 *   get:
 *     summary: Get properties by location path
 *     description: Retrieve property listings from SOA API based on geographic location path. The path is automatically mapped from our geo format to SOA API format.
 *     parameters:
 *       - in: path
 *         name: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Geographic location path in our format (will be mapped to SOA API format)
 *         examples:
 *           state:
 *             summary: State search
 *             value: tx
 *             description: Maps to tx/ (Texas for SOA API)
 *           city:
 *             summary: City search
 *             value: tx/round-rock
 *             description: Maps to round-rock-tx/
 *           county:
 *             summary: County search
 *             value: tx/williamson_county
 *             description: Maps to williamson-county-tx/
 *           zipcode:
 *             summary: Zipcode search
 *             value: tx/78664
 *             description: Maps to tx/78664/
 *           neighborhood:
 *             summary: Neighborhood search
 *             value: tx/round-rock/old-town_neighborhood
 *             description: Maps to round-rock-tx/old-town/
 *     responses:
 *       200:
 *         description: List of properties converted to article format
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Unique property identifier
 *                     example: "24cd15f9-647d-4361-9efe-2debf74376e2"
 *                   img:
 *                     type: string
 *                     description: Property thumbnail image URL
 *                     example: "image absolute url"
 *                   imgTag:
 *                     type: string
 *                     description: Image attribution tag
 *                     example: "MLSListings"
 *                   imgAlt:
 *                     type: string
 *                     description: Alt text for the image
 *                     example: "181 Alexander Ave, San Jose, CA 95116"
 *                   title:
 *                     type: string
 *                     description: Full property address
 *                     example: "181 Alexander Ave, San Jose, CA 95116"
 *                   href:
 *                     type: string
 *                     description: Property detail page URL
 *                     example: "page abosolution url"
 *                   tags:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         key:
 *                           type: string
 *                           example: "major"
 *                         value:
 *                           type: string
 *                           example: "New"
 *                     description: Property status tags
 *                   attrs:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         key:
 *                           type: string
 *                           example: "Est"
 *                         value:
 *                           type: string
 *                           example: "$1,750,000"
 *                         desc:
 *                           type: string
 *                           example: "Estimate Price"
 *                     description: Property attributes (price, beds, baths, sqft, price per sqft)
 *     tags:
 *       - Properties
 */
router.get('/properties/:path(*)', async (req, res) => {
	try {
		const { path } = req.params;
		let soaPath = mapGeoPathToSOAPath(path);
		// Fetch properties using reusable function
		const properties = await fetchPropertiesFromSOA(soaPath);
		const articles = mapPropertiesToArticles(properties);
		res.json(articles);
	} catch (error) {
		console.error('Error fetching properties:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
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
