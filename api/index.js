import env from "dotenv";
import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerSpecs from "../config/swagger.js";
import cors from "cors";

const app = express();

env.config();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//Loading Routes
import apiRoutes from "../routes/api.js";
import ErrorHandler from "../app/middlewares/ErrorHandler.js";

// Serve swagger.json directly
app.get("/swagger.json", (_, res) => {
  res.json(swaggerSpecs);
});

// Enhanced Swagger documentation
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

// Debug route to check swagger spec
app.get("/swagger-debug", async (_, res) => {
  try {
    res.json({
      message: "Swagger spec loaded successfully",
      hasSpecs: !!swaggerSpecs,
      pathCount: Object.keys(swaggerSpecs.paths || {}).length,
      serverCount: (swaggerSpecs.servers || []).length,
      title: swaggerSpecs.info?.title || "Unknown",
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

// For shared hosting compatibility
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "127.0.0.1";

// Only start server if not in Vercel environment
if (process.env.VERCEL !== "1") {
  // Start server for local development
  app.listen(PORT, HOST, async () => {
    console.log(`🚀 SongBanks API Server started successfully`);
    console.log(`📍 Running on: ${HOST}:${PORT}`);
    console.log(`📚 API Documentation: ${HOST}:${PORT}/api-docs`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);

    // Only show network info in development
    if (process.env.NODE_ENV !== "production") {
      try {
        const os = await import("os");
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
      } catch {
        // Silently handle any network interface errors in shared hosting
      }
    }
  });
}

// Export the Express app for Vercel
export default app;