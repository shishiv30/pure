import swaggerJsdoc from 'swagger-jsdoc';
import config from './config.js';

const options = {
	definition: {
		openapi: '3.0.0', // Specify OpenAPI version
		info: {
			title: 'Node.js REST API', // Title for your API
			version: '1.0.0', // Version of your API
			description: 'API documentation for my Node.js application', // Description of the API
		},
		servers: [
			{
				url: `${config.appUrl}/api`, // Dynamic URL based on config
			},
		],
	},
	apis: ['./server/routes/api.js'], // Path form root
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
