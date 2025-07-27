module.exports = {
  type: "object",
  properties: {
    error: {
      type: "string",
      example: "Bad request",
    },
    message: {
      type: "string",
      example: "Bad request",
    },
    statusCode: {
      type: "integer",
      example: 400,
    },
  },
};
