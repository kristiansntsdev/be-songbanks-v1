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

app.listen(process.env.PORT, '0.0.0.0', () => {
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  
  console.log(`Server running on port ${process.env.PORT}`);
  console.log('Accessible URLs:');
  console.log(`  Local: http://localhost:${process.env.PORT}`);
  
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    networkInterfaces[interfaceName].forEach((network) => {
      if (network.family === 'IPv4' && !network.internal) {
        console.log(`  Network: http://${network.address}:${process.env.PORT}`);
      }
    });
  });
});
