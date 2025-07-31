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
      example: "Login successful",
      description: "Response message",
    },
    data: {
      type: "object",
      properties: {
        token: {
          type: "string",
          example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          description: "JWT authentication token",
        },
        user: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "10",
            },
            nama: {
              type: "string",
              example: "BRIM Nasional",
            },
            username: {
              type: "string",
              example: "brimnasional@gmail.com",
            },
            userType: {
              type: "string",
              enum: ["pengurus", "peserta"],
              example: "pengurus",
            },
            isAdmin: {
              type: "boolean",
              example: true,
            },
            leveladmin: {
              type: "string",
              example: "2",
              description: "Only present for pengurus (admin) users",
            },
            userlevel: {
              type: "string",
              example: "4",
              description: "Only present for peserta (regular) users",
            },
            verifikasi: {
              type: "string",
              example: "1",
              description: "Only present for peserta (regular) users",
            },
          },
        },
      },
    },
  },
};
