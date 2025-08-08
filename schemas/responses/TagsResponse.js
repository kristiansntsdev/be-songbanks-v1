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
      example: "Tags retrieved successfully",
      description: "Response message",
    },
    data: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: {
            type: "string",
            example: "1",
          },
          name: {
            type: "string",
            example: "rock",
          },
          description: {
            type: "string",
            example: "Rock music genre",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2023-01-01T00:00:00.000Z",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2023-01-01T00:00:00.000Z",
          },
        },
      },
    },
  },
};
