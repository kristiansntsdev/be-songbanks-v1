module.exports = {
  type: "object",
  required: ["name"],
  properties: {
    name: {
      type: "string",
      minLength: 1,
      maxLength: 50,
      example: "blues",
      description: "Tag name (required, will be trimmed)",
    },
    description: {
      type: "string",
      maxLength: 255,
      example: "Blues music genre",
      description: "Optional tag description",
    },
  },
};
