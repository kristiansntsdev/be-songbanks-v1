export default {
  type: "object",
  properties: {
    code: {
      type: "integer",
      example: 409,
    },
    message: {
      type: "string",
      example: "A playlist with this name already exists",
    },
    error: {
      type: "string",
      example: "Conflict",
    },
  },
};
