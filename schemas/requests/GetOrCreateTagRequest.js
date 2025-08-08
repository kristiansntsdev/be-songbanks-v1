export default {
  type: "object",
  required: ["name"],
  properties: {
    name: {
      type: "string",
      example: "rock",
      description: "Name of the tag to get or create",
    },
  },
};
