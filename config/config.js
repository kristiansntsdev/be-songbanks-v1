const path = require('path');
const env = require('dotenv');
env.config();

module.exports = {
  development: {
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', 'database', 'development.sqlite'),
    logging: console.log, // Enable SQL logging for debugging
  },
  test: {
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', 'database', 'test.sqlite'),
    logging: false, // Disable logging for tests
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql'
  }
};