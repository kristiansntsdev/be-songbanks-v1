module.exports = {
  type: "object",
  properties: {
    error: {
      type: "string",
      example: "Internal server error",
    },
    message: {
      type: "string",
      example: "Internal server error",
    },
    statusCode: {
      type: "integer",
      example: 500,
    },
  },
};
