module.exports = {
  type: "object",
  properties: {
    error: {
      type: "string",
      example: "Validation Error",
    },
    message: {
      type: "string",
      example: "Validation failed",
    },
    statusCode: {
      type: "integer",
      example: 422,
    },
    details: {
      type: "array",
      items: {
        type: "string",
      },
      example: ["Field 'name' is required", "Field 'email' must be valid"],
    },
  },
};
