import { SwaggerOptions } from 'swagger-ui-express';

const options: SwaggerOptions = {
	swaggerDefinition: {
		openapi: '3.1.0',
		info: {
			title: 'Orbit API',
			description: 'API para la aplicación Orbit',
			version: '1.0.0',
		},
		servers: [
			{ url: 'http://localhost:3001' },
			{ url: 'http://localhost:3000' }
		],
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
	apis: ['./src/**/*.ts'],
};

export default options;
