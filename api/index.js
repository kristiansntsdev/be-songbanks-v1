const env = require('dotenv');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('../config/swagger');
const cors = require('cors');

const app = express();

env.config();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Loading Routes
const apiRoutes = require('../routes/api');
const ErrorHandler = require('../app/middlewares/ErrorHandler');

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Root route
app.get('/', (_, res) => {
  res.json({
    message: 'Welcome to Songbanks API',
    documentation: '/api-docs',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api', apiRoutes);

// Error handling
app.use(ErrorHandler.notFound);
app.use(ErrorHandler.handle);

// Export the Express app for Vercel
module.exports = app;