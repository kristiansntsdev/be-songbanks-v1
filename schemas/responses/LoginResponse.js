module.exports = {
  type: "object",
  properties: {
    code: {
      type: "integer",
      example: 200,
      description: "HTTP status code",
    },
    message: {
      type: "string",
      example: "Login successful",
      description: "Response message",
    },
    data: {
      type: "object",
      properties: {
        token: {
          type: "string",
          example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          description: "JWT authentication token",
        },
        user: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "01K0HRB1K30FG2B0K9476V3JN8",
            },
            email: {
              type: "string",
              example: "user@example.com",
            },
            role: {
              type: "string",
              example: "user",
            },
          },
        },
      },
    },
  },
};
