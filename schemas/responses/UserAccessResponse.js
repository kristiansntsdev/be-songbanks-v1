export default {
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
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: {
                    type: "integer",
                    example: 1,
                  },
                  nama: {
                    type: "string",
                    example: "Sintikhe Damayanti",
                  },
                  username: {
                    type: "string",
                    example: "sintikhed@gmail.com",
                  },
                  userType: {
                    type: "string",
                    example: "peserta",
                  },
                  isAdmin: {
                    type: "boolean",
                    example: false,
                  },
                  status: {
                    type: "string",
                    example: "pending",
                    enum: ["active", "request", "suspend", "pending"],
                  },
                  role: {
                    type: "string",
                    example: "member",
                    enum: ["member", "guest"],
                  },
                },
                required: [
                  "id",
                  "nama",
                  "username",
                  "userType",
                  "isAdmin",
                  "status",
                  "role",
                ],
              },
            },
            pagination: {
              type: "object",
              properties: {
                currentPage: {
                  type: "integer",
                  example: 1,
                },
                totalPages: {
                  type: "integer",
                  example: 400,
                },
                totalItems: {
                  type: "integer",
                  example: 4000,
                },
                itemsPerPage: {
                  type: "integer",
                  example: 10,
                },
                hasNextPage: {
                  type: "boolean",
                  example: true,
                },
                hasPrevPage: {
                  type: "boolean",
                  example: false,
                },
              },
              required: [
                "currentPage",
                "totalPages",
                "totalItems",
                "itemsPerPage",
                "hasNextPage",
                "hasPrevPage",
              ],
            },
          },
          required: ["code", "message", "data", "pagination"],
        },
      },
    },
  },
};
