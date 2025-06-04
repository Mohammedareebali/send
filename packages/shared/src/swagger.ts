import { OpenAPIObject } from '@nestjs/swagger';

export const swaggerConfig: OpenAPIObject = {
  openapi: '3.0.0',
  info: {
    title: 'School Transportation API',
    version: '1.0.0',
    description: 'API documentation for the School Transportation System',
    contact: {
      name: 'API Support',
      email: 'support@example.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server'
    },
    {
      url: 'https://api.example.com',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      },
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['ADMIN', 'DRIVER', 'PARENT'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Vehicle: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          make: { type: 'string' },
          model: { type: 'string' },
          year: { type: 'integer' },
          licensePlate: { type: 'string' },
          status: {
            type: 'string',
            enum: ['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'OUT_OF_SERVICE']
          },
          capacity: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Driver: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          licenseNumber: { type: 'string' },
          status: {
            type: 'string',
            enum: ['AVAILABLE', 'ASSIGNED', 'OFF_DUTY', 'SUSPENDED']
          },
          vehicleId: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Error: {
        type: 'object',
        properties: {
          statusCode: { type: 'integer' },
          message: { type: 'string' },
          error: { type: 'string' }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    },
    {
      apiKeyAuth: []
    }
  ],
  paths: {
    // Define your API paths here
    // Example:
    // '/api/vehicles': {
    //   get: {
    //     tags: ['Vehicles'],
    //     summary: 'Get all vehicles',
    //     responses: {
    //       '200': {
    //         description: 'Successful operation',
    //         content: {
    //           'application/json': {
    //             schema: {
    //               type: 'array',
    //               items: { $ref: '#/components/schemas/Vehicle' }
    //             }
    //           }
    //         }
    //       }
    //     }
    //   }
    // }
  }
}; 