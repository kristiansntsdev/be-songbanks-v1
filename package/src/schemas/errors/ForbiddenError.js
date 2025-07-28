export default {
  type: "object",
  properties: {
    error: {
      type: "string",
      example: "Forbidden",
    },
    message: {
      type: "string",
      example: "Access denied",
    },
    statusCode: {
      type: "integer",
      example: 403,
    },
  },
};
