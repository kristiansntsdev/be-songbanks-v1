export default {
  200: {
    description: "User access status updated successfully",
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
              example: "User status changed to active",
            },
            data: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  description: "User ID",
                  example: "user123",
                },
                status: {
                  type: "string",
                  description: "Updated user status",
                  example: "active",
                },
              },
            },
          },
        },
      },
    },
  },
};
