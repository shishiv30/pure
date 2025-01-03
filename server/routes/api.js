import express from 'express';
const router = express.Router();
import BaseController from '../controllers/baseController.js';

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
 *           enum: [state, city, county, zip, neighborhood]
 *         description: Type of geo information
 *       - in: query
 *         name: text
 *         schema:
 *           type: string
 *         description: Search text
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           default: 10
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
 */
router.get('/geo', async (req, res) => {
	//get current router is get or post or put or delete
	let controller = new BaseController(req, res, 'geo');
	let result = await controller.get();
	controller.toData(result);
});

export default router;
