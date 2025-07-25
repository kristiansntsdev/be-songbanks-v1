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

// Serve swagger.json directly
app.get('/swagger.json', (_, res) => {
  res.json(swaggerSpecs);
});

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCssUrl: 'https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui.css',
  customJs: [
    'https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui-bundle.js',
    'https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui-standalone-preset.js'
  ],
  swaggerOptions: {
    url: '/swagger.json'
  }
}));

// Root route
app.get('/', (_, res) => {
  res.json({
    message: 'Welcome to Songbanks API',
    documentation: '/api-docs',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Debug route to check swagger spec
app.get('/swagger-debug', (_, res) => {
  try {
    const swaggerSpecs = require('../config/swagger');
    res.json({
      message: 'Swagger spec loaded successfully',
      hasSpecs: !!swaggerSpecs,
      pathCount: Object.keys(swaggerSpecs.paths || {}).length,
      serverCount: (swaggerSpecs.servers || []).length,
      title: swaggerSpecs.info?.title || 'Unknown'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error loading swagger spec',
      error: error.message
    });
  }
});

// API routes
app.use('/api', apiRoutes);

// Error handling
app.use(ErrorHandler.notFound);
app.use(ErrorHandler.handle);

// Export the Express app for Vercel
module.exports = app;