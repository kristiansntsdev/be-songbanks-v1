const Sequelize = require('sequelize');
const config = require('./config.js');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

let sequelize;

if (dbConfig.dialect === 'sqlite') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbConfig.storage,
    logging: dbConfig.logging
  });
} else if (dbConfig.dialect === 'postgres') {
  // For PostgreSQL (production)
  sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: 'postgres',
    dialectOptions: dbConfig.dialectOptions,
    logging: dbConfig.logging,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else {
  // For MySQL (development)
  sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
}

module.exports = sequelize;