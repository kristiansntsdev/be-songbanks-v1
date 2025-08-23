export default {
  type: "object",
  properties: {
    code: {
      type: "integer",
      example: 200,
    },
    message: {
      type: "string",
      example: "Artists retrieved successfully",
    },
    data: {
      type: "array",
      items: {
        type: "string",
        example: "JPCC Worship",
        description: "Artist name",
      },
      description: "Array of unique artist names",
    },
  },
};
