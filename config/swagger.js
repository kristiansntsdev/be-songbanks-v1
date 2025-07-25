const fs = require('fs');
const path = require('path');

let swaggerSpec;

try {
  // Try to load the generated swagger.json file
  const swaggerPath = path.join(__dirname, '..', 'swagger', 'swagger.json');
  
  if (fs.existsSync(swaggerPath)) {
    swaggerSpec = require('../swagger/swagger.json');
    
    // Update server URLs for production
    if (process.env.NODE_ENV === 'production') {
      swaggerSpec.servers = [
        {
          url: 'https://songbanks-v1-1.vercel.app/api',
          description: "Production server"
        },
        {
          url: "http://localhost:3000/api",
          description: "Development server"
        }
      ];
    }
  } else {
    // Fallback swagger spec if file doesn't exist
    swaggerSpec = {
      "openapi": "3.0.0",
      "info": {
        "title": "SongBanks API",
        "description": "API documentation for SongBanks application",
        "version": "1.0.0"
      },
      "servers": [
        {
          "url": process.env.NODE_ENV === 'production' 
            ? "https://songbanks-v1-1.vercel.app/api"
            : "http://localhost:3000/api",
          "description": process.env.NODE_ENV === 'production' ? "Production server" : "Development server"
        }
      ],
      "paths": {
        "/": {
          "get": {
            "summary": "API Root",
            "responses": {
              "200": {
                "description": "Welcome message",
                "content": {
                  "application/json": {
                    "schema": {
                      "type": "object",
                      "properties": {
                        "message": { "type": "string" },
                        "version": { "type": "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };
  }
} catch (error) {
  console.error('Error loading Swagger spec:', error.message);
  
  // Minimal fallback spec
  swaggerSpec = {
    "openapi": "3.0.0",
    "info": {
      "title": "SongBanks API",
      "description": "API documentation temporarily unavailable",
      "version": "1.0.0"
    },
    "servers": [
      {
        "url": process.env.NODE_ENV === 'production' 
          ? "https://songbanks-v1-1.vercel.app/api"
          : "http://localhost:3000/api",
        "description": "API Server"
      }
    ],
    "paths": {}
  };
}

module.exports = swaggerSpec;