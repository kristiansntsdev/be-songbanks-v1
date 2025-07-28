module.exports = {
  200: {
    description: "User access list retrieved successfully",
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
              example: "User access list retrieved successfully",
            },
            data: {
              type: "object",
              properties: {
                active_users: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: {
                        type: "string",
                        example: "user123",
                      },
                      email: {
                        type: "string",
                        example: "user@example.com",
                      },
                      role: {
                        type: "string",
                        example: "member",
                      },
                      status: {
                        type: "string",
                        example: "active",
                      },
                    },
                  },
                },
                request_users: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: {
                        type: "string",
                        example: "user456",
                      },
                      email: {
                        type: "string",
                        example: "request@example.com",
                      },
                      role: {
                        type: "string",
                        example: "member",
                      },
                      status: {
                        type: "string",
                        example: "request",
                      },
                    },
                  },
                },
                suspended_users: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: {
                        type: "string",
                        example: "user789",
                      },
                      email: {
                        type: "string",
                        example: "suspended@example.com",
                      },
                      role: {
                        type: "string",
                        example: "member",
                      },
                      status: {
                        type: "string",
                        example: "suspend",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
