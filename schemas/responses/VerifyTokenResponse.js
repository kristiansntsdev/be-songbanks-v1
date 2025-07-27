module.exports = {
  type: "object",
  properties: {
    code: {
      type: "integer",
      example: 200,
      description: "HTTP status code"
    },
    message: {
      type: "string",
      example: "Token verified successfully",
      description: "Response message"
    },
    data: {
      type: "object",
      properties: {
        user: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "01K0HRB1K30FG2B0K9476V3JN8"
            },
            email: {
              type: "string",
              example: "user@example.com"
            },
            role: {
              type: "string",
              example: "user"
            }
          }
        }
      }
    }
  }
};