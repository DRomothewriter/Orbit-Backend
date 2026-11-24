import { SwaggerOptions } from 'swagger-ui-express';

const port = process.env.PORT || 3000;

const options: SwaggerOptions = {
	swaggerDefinition: {
		openapi: '3.1.0',
		info: {
			title: 'Orbit Backend API',
			description: 'API para fines educativos',
			version: '1.0.0',
		},
		servers: [{ url: 'http://localhost:' + port }],
		components: {
			securitySchemes: {
				bearerAuth: {
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT',
				},
			},
		},
		security: [{ bearerAuth: [] }],
	},
	apis: ['./src/**/*.ts', './dist/src/**/*.js'],
};

export default options;
