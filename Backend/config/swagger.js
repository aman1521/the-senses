const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'The Senses API',
            version: '1.0.0',
            description: 'API Documentation for The Senses Platform - An AI-driven Cognitive Assessment System.',
            contact: {
                name: 'The Senses Support',
                email: 'support@thesenses.ai' // Example email
            },
        },
        servers: [
            {
                url: 'http://localhost:5000/api/v1',
                description: 'Local Development Server (v1)'
            },
            {
                url: 'https://api.thesenses.ai/api/v1',
                description: 'Production Server (v1)'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                SuccessResp: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string', example: 'Success' },
                        data: { type: 'object' }
                    }
                },
                ErrorResp: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string', example: 'Error occurred' },
                        error: { type: 'string', example: 'Detailed error message' }
                    }
                }
            }
        },
        security: [{
            bearerAuth: []
        }],
    },
    apis: ['./routes/*.js', './controllers/*.js', './models/*.js'], // Scan these files for annotations
};

const specs = swaggerJsdoc(options);

module.exports = specs;
