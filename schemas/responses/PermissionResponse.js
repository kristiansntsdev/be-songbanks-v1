export default {
  type: "object",
  properties: {
    code: {
      type: "integer",
      example: 200,
      description: "HTTP status code",
    },
    message: {
      type: "string",
      example: "Permission granted",
      description: "Response message",
    },
    data: {
      type: "object",
      properties: {
        hasPermission: {
          type: "boolean",
          example: true,
          description: "Whether user has the required permission",
        },
        userType: {
          type: "string",
          enum: ["pengurus", "peserta"],
          example: "pengurus",
          description: "Current user type",
        },
        isAdmin: {
          type: "boolean",
          example: true,
          description: "Whether user is admin",
        },
      },
    },
  },
};
