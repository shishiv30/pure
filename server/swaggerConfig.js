import swaggerJsdoc from 'swagger-jsdoc';

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
				url: 'http://localhost:3000/api', // Base URL of your API
			},
		],
	},
	apis: ['./server/routes/api.js'], // Path form root
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
