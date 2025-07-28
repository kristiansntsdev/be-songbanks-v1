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
      example: "Token refreshed successfully",
      description: "Response message",
    },
    data: {
      type: "object",
      properties: {
        token: {
          type: "string",
          example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          description: "New JWT authentication token",
        },
      },
    },
  },
};
