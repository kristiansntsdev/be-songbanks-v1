import Sequelize from "sequelize";
import config from "./config.js";
import mysql2 from "mysql2";

// Explicitly import mysql2 package for Vercel deployment
if (process.env.NODE_ENV === "production") {
  console.log("✅ MySQL2 package loaded for production:", !!mysql2);
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
} else if (dbConfig.dialect === "mysql") {
  // Log database configuration for debugging (without password)
  console.log(`📦 Database config [${env}]:`, {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    username: dbConfig.username,
    passwordSet: !!dbConfig.password,
  });

  // For MySQL (both development and production)
  const sequelizeConfig = {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: "mysql",
    logging: dbConfig.logging,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    retry: {
      max: 3,
    },
    dialectOptions: {
      connectTimeout: 60000,
    },
  };

  // Add dialectModule for production (Vercel deployment)
  if (process.env.NODE_ENV === "production") {
    sequelizeConfig.dialectModule = mysql2;
    // Disable SSL for servers that don't support it
    sequelizeConfig.dialectOptions.ssl = false;
  }

  try {
    sequelize = new Sequelize(
      dbConfig.database,
      dbConfig.username,
      dbConfig.password,
      sequelizeConfig
    );
  } catch (error) {
    console.error("❌ Failed to initialize Sequelize:", error.message);
    throw error;
  }
}

export default sequelize;
