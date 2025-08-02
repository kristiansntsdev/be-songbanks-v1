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
      example: "User list retrieved successfully",
      description: "Response message",
    },
    data: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id_peserta: {
            type: "integer",
            example: 1,
            description: "User ID",
          },
          usercode: {
            type: "string",
            example: "LUP-1",
            description: "User code",
          },
          nama: {
            type: "string",
            example: "Sintikhe Damayanti",
            description: "User full name",
          },
          gender: {
            type: "string",
            example: "Wanita",
            description: "User gender",
          },
          email: {
            type: "string",
            example: "sintikhed@gmail.com",
            description: "User email address",
          },
          userlevel: {
            type: "string",
            example: "5",
            description: "User access level",
          },
          status: {
            type: "string",
            example: "active",
            description: "User account status",
          },
          role: {
            type: "string",
            example: "member",
            description: "User role",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2024-01-01T12:00:00Z",
            description: "Account creation timestamp",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2024-01-01T12:00:00Z",
            description: "Last update timestamp",
          },
        },
      },
      description: "Array of user objects",
    },
    pagination: {
      type: "object",
      properties: {
        currentPage: {
          type: "integer",
          example: 1,
          description: "Current page number",
        },
        totalPages: {
          type: "integer",
          example: 5,
          description: "Total number of pages",
        },
        totalItems: {
          type: "integer",
          example: 50,
          description: "Total number of items",
        },
        itemsPerPage: {
          type: "integer",
          example: 10,
          description: "Number of items per page",
        },
      },
      description: "Pagination information",
    },
    search: {
      type: "string",
      example: "sintikhe",
      description: "Search term used for filtering (null if no search applied)",
    },
  },
};
