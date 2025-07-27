module.exports = {
  type: "object",
  required: ["token"],
  properties: {
    token: {
      type: "string",
      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      description: "JWT token to verify"
    }
  }
};