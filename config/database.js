import Sequelize from "sequelize";
import config from "./config.js";

// Check if we're in production and need PostgreSQL
const needsPostgreSQL = process.env.NODE_ENV === "production" || process.env.PROD_DB_HOST;

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
  // For PostgreSQL (production)
  try {
    sequelize = new Sequelize(
      dbConfig.database,
      dbConfig.username,
      dbConfig.password,
      {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: "postgres",
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
  } catch (error) {
    console.error("❌ Error initializing PostgreSQL connection:", error.message);
    
    if (error.message.includes("pg")) {
      console.error("💡 PostgreSQL driver (pg) not found or failed to load");
      console.error("🔧 Solutions:");
      console.error("   1. Ensure 'pg' is in package.json dependencies (not devDependencies)");
      console.error("   2. Run: npm install pg@latest");
      console.error("   3. Check that build process includes all dependencies");
      console.error("   4. Verify NODE_ENV is set correctly");
    }
    
    throw error;
  }
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
