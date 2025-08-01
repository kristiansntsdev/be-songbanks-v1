export default {
  200: {
    description: "User access status or role updated successfully",
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            code: {
              type: "integer",
              example: 200,
            },
            message: {
              type: "string",
              example: "User status updated to active successfully",
            },
            data: {
              type: "object",
              properties: {
                id: {
                  type: "integer",
                  description: "User ID",
                  example: 17,
                },
                nama: {
                  type: "string",
                  description: "User full name",
                  example: "Melody Charis Frynikel Lakoy",
                },
                username: {
                  type: "string",
                  description: "User email/username",
                  example: "melody.19197@gmail.com",
                },
                status: {
                  type: "string",
                  description: "Updated user status",
                  example: "active",
                  enum: ["active", "suspend", "request", "pending"],
                },
                role: {
                  type: "string",
                  description: "User role",
                  example: "member",
                  enum: ["guest", "member", "admin"],
                },
              },
              required: ["id", "nama", "username", "status", "role"],
            },
          },
          required: ["code", "message", "data"],
        },
      },
    },
  },
};
