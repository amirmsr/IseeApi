import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

const app = express();
app.use(express.json())

const options = {
    swaggerDefinition: {
      openapi: '3.0.0',
      info: {
        title: 'iBay API, Iyad Amir Marcel Yohan, BENG3',
        version: '1.0.0',
        description: 'Final version',
      },
      servers: [
        {
          url: 'http://localhost:3000',
        },
      ],
    },
    apis: ['src/routers/*.js'],
};
  
const specs = swaggerJsdoc(options);
  
app.use('/documentation', swaggerUi.serve, swaggerUi.setup(specs));

export default app