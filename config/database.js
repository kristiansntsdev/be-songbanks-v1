import Sequelize from "sequelize";
import config from "./config.js";
import pg from "pg";
import pgHstore from "pg-hstore";

// Explicitly import pg packages for Vercel deployment
if (process.env.NODE_ENV === "production") {
  console.log("✅ PostgreSQL packages loaded for production:", !!pg, !!pgHstore);
}

const env = process.env.NODE_ENV || "production";
const dbConfig = config[env];

let sequelize;

if (dbConfig.dialect === "sqlite") {
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: dbConfig.storage,
    logging: dbConfig.logging,
  });
} else if (dbConfig.dialect === "postgres") {
  // For PostgreSQL (production) - explicitly specify dialectModule
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: "postgres",
      dialectModule: pg,
      dialectOptions: dbConfig.dialectOptions,
      logging: dbConfig.logging,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    }
  );
} else {
  // For MySQL (development)
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: dbConfig.dialect,
      logging: dbConfig.logging,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    }
  );
}

export default sequelize;
