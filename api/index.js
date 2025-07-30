import env from "dotenv";
import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerSpecs from "../config/swagger.js";
import cors from "cors";
import sequelize from "../config/database.js";

const app = express();

env.config();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Loading Routes
import apiRoutes from "../routes/api.js";
import ErrorHandler from "../app/middlewares/ErrorHandler.js";

// Serve swagger.json directly
app.get("/swagger.json", (_, res) => {
  res.json(swaggerSpecs);
});

// Swagger documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpecs, {
    customCssUrl: "https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui.css",
    customJs: [
      "https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui-bundle.js",
      "https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui-standalone-preset.js",
    ],
    swaggerOptions: {
      url: "/swagger.json",
    },
  })
);

// Root route
app.get("/", (_, res) => {
  res.json({
    message: "Welcome to Songbanks API",
    documentation: "/api-docs",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
  });
});

// Health check route with database status
app.get("/health", async (_, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      status: "healthy",
      database: "connected",
      dialect: sequelize.getDialect(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      database: "disconnected",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Health check route with database status
app.get("/health", async (_, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      status: "healthy",
      database: "connected",
      dialect: sequelize.getDialect(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      database: "disconnected",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Debug route to check swagger spec
app.get("/swagger-debug", async (_, res) => {
  try {
    const { default: swaggerSpecsDebug } = await import("../config/swagger.js");
    res.json({
      message: "Swagger spec loaded successfully",
      hasSpecs: !!swaggerSpecsDebug,
      pathCount: Object.keys(swaggerSpecsDebug.paths || {}).length,
      serverCount: (swaggerSpecsDebug.servers || []).length,
      title: swaggerSpecsDebug.info?.title || "Unknown",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error loading swagger spec",
      error: error.message,
    });
  }
});

// API routes
app.use("/api", apiRoutes);

// Error handling
app.use(ErrorHandler.notFound);
app.use(ErrorHandler.handle);

// Export the Express app for Vercel
export default app;
