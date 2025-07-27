module.exports = {
  type: "object",
  properties: {
    error: {
      type: "string",
      example: "Unauthorized",
    },
    message: {
      type: "string",
      example: "Unauthorized",
    },
    statusCode: {
      type: "integer",
      example: 401,
    },
  },
};
