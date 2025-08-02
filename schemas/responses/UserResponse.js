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
      example: "Current user retrieved successfully",
      description: "Response message",
    },
    data: {
      type: "object",
      properties: {
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
            nowa: {
              type: "string",
              example: "08123456789",
              description: "Phone number",
            },
            kotalevelup: {
              type: "string",
              example: "Jakarta",
              description: "City level up",
            },
          },
        },
      },
    },
  },
};
