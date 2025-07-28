module.exports = {
  type: "object",
  properties: {
    code: {
      type: "integer",
      example: 201,
      description: "HTTP status code",
    },
    message: {
      type: "string",
      example: "Tag created successfully",
      description: "Response message",
    },
    data: {
      type: "object",
      properties: {
        id: {
          type: "integer",
          example: 1,
          description: "Created tag ID",
        },
        name: {
          type: "string",
          example: "blues",
          description: "Created tag name",
        },
      },
      description: "Created tag data",
    },
  },
};
