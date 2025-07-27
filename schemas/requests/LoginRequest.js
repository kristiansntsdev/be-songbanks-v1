module.exports = {
  type: "object",
  required: ["email", "password"],
  properties: {
    email: {
      type: "string",
      format: "email",
      example: "user@example.com",
      description: "User's email address",
    },
    password: {
      type: "string",
      example: "password123",
      description: "User's password",
    },
  },
};
