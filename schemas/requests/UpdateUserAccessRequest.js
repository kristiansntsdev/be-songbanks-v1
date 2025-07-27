module.exports = {
  type: "object",
  required: ["status"],
  properties: {
    status: {
      type: "string",
      enum: ["active", "suspend"],
      description: "User access status",
      example: "active"
    }
  }
};