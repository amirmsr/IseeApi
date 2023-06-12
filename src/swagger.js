import express from "express";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";

const app = express();
app.use(express.json())

const swaggerFile = YAML.load('src/swagger.yaml')

app.use('/documentation', swaggerUi.serve, swaggerUi.setup(swaggerFile));

export default app