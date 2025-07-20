const env = require('dotenv');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const cors = require('cors');

const app = express();

app.use(cors())

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

// For shared hosting compatibility
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';

app.listen(PORT, HOST, () => {
  console.log(`🚀 SongBanks API Server started successfully`);
  console.log(`📍 Running on: ${HOST}:${PORT}`);
  console.log(`📚 API Documentation: ${HOST}:${PORT}/api-docs`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Only show network info in development
  if (process.env.NODE_ENV !== 'production') {
    try {
      const os = require('os');
      const networkInterfaces = os.networkInterfaces();
      console.log('\n🔗 Network Access:');
      
      Object.keys(networkInterfaces).forEach((interfaceName) => {
        networkInterfaces[interfaceName].forEach((network) => {
          if (network.family === 'IPv4' && !network.internal) {
            console.log(`  • ${interfaceName}: http://${network.address}:${PORT}`);
          }
        });
      });
    } catch (error) {
      // Silently handle any network interface errors in shared hosting
    }
  }
});
