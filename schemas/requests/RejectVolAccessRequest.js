export default {
  type: "object",
  required: ["user_id"],
  properties: {
    user_id: {
      type: "string",
      example: "1",
      description: "The ID of the user to reject vol_user access for",
    },
  },
};
