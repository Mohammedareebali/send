declare module 'swagger-jsdoc' {
  interface SwaggerOptions {
    definition: {
      openapi?: string;
      info: {
        title: string;
        version: string;
        description?: string;
      };
      servers?: Array<{
        url: string;
        description?: string;
      }>;
      components?: {
        securitySchemes?: {
          [key: string]: {
            type: string;
            scheme: string;
            bearerFormat?: string;
          };
        };
      };
      security?: Array<{ [key: string]: string[] }>;
    };
    apis: string[];
  }

  function swaggerJsdoc(options: SwaggerOptions): any;
  export = swaggerJsdoc;
} 