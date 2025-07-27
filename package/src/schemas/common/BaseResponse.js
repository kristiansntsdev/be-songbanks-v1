module.exports = {
  type: "object",
  properties: {
    code: {
      type: "integer",
      description: "HTTP status code",
    },
    message: {
      type: "string",
      description: "Response message",
    },
  },
};
