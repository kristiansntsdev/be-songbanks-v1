const env = require('dotenv');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

const app = express();

//Loading Routes
const apiRoutes = require('./routes/api');
const ErrorController = require('./app/controllers/ErrorController');

env.config();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Root route
app.get('/', (_, res) => {
  res.json({
    message: 'Welcome to Songbanks API',
    documentation: '/api-docs',
    version: '1.0.0'
  });
});

app.use('/api', apiRoutes);

app.use(ErrorController.notFound);
app.use(ErrorController.handleError);

app.listen(process.env.PORT);
console.log("API listening on port " + process.env.PORT);
