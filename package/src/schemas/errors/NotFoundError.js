export default {
  type: "object",
  properties: {
    error: {
      type: "string",
      example: "Not Found",
    },
    message: {
      type: "string",
      example: "Resource not found",
    },
    statusCode: {
      type: "integer",
      example: 404,
    },
  },
};
