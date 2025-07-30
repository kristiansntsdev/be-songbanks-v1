import * as dotenv from "dotenv";
import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerSpecs from "./config/swagger.js";
import cors from "cors";
import sequelize from "./config/database.js";

const app = express();

app.use(cors());

//Loading Routes
import apiRoutes from "./routes/api.js";
import ErrorHandler from "./app/middlewares/ErrorHandler.js";

dotenv.config();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Root route
app.get("/", (_, res) => {
  res.json({
    message: "Welcome to Songbanks API",
    documentation: "/api-docs",
    version: "1.0.0",
  });
});

app.use("/api", apiRoutes);

app.use(ErrorHandler.notFound);
app.use(ErrorHandler.handle);

// For shared hosting compatibility
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "127.0.0.1";

app.listen(PORT, HOST, async () => {
  console.log(`🚀 SongBanks API Server started successfully`);
  console.log(`📍 Running on: ${HOST}:${PORT}`);
  console.log(`📚 API Documentation: ${HOST}:${PORT}/api-docs`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);

  // Test database connection
  try {
    await sequelize.authenticate();
    console.log(`✅ Database connected successfully (${sequelize.getDialect()})`);
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    if (error.message.includes("pg")) {
      console.error("💡 Tip: Make sure PostgreSQL driver 'pg' is installed: npm install pg");
    }
  }

  // Only show network info in development
  if (process.env.NODE_ENV !== "production") {
    try {
      const { default: os } = await import("os");
      const networkInterfaces = os.networkInterfaces();
      console.log("\n🔗 Network Access:");

      Object.keys(networkInterfaces).forEach((interfaceName) => {
        networkInterfaces[interfaceName].forEach((network) => {
          if (network.family === "IPv4" && !network.internal) {
            console.log(
              `  • ${interfaceName}: http://${network.address}:${PORT}`
            );
          }
        });
      });
    } catch (error) {
      // Silently handle any network interface errors in shared hosting
    }
  }
});
