module.exports = {
  type: "object",
  required: ["user_id"],
  properties: {
    user_id: {
      type: "string",
      example: "user123",
      description: "The ID of the user requesting vol_user access"
    }
  }
};