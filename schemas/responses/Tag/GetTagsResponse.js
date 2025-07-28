module.exports = {
  type: "object",
  properties: {
    code: {
      type: "integer",
      example: 200,
      description: "HTTP status code",
    },
    message: {
      type: "string",
      example: "Tags retrieved successfully",
      description: "Response message",
    },
    data: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: {
            type: "integer",
            example: 1,
            description: "Tag unique identifier",
          },
          name: {
            type: "string",
            example: "blues",
            description: "Tag name",
          },
          description: {
            type: "string",
            nullable: true,
            example: "Blues music genre",
            description: "Tag description (can be null)",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2024-01-15T10:30:00.000Z",
            description: "Tag creation timestamp",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2024-01-15T10:30:00.000Z",
            description: "Tag last update timestamp",
          },
        },
      },
      description: "Array of tags",
    },
  },
};
