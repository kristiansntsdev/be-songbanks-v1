export default {
  type: "object",
  required: ["username", "password"],
  properties: {
    username: {
      type: "string",
      example: "brimnasional@gmail.com",
      description: "Username for admin or email for user",
    },
    password: {
      type: "string",
      example: "password123",
      description: "User's password",
    },
  },
};
