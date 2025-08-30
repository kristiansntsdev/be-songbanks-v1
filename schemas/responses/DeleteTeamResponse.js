export default {
  type: "object",
  properties: {
    code: {
      type: "integer",
      example: 200,
    },
    message: {
      type: "string",
      example: "Playlist team deleted successfully",
    },
    data: {
      type: "object",
      properties: {
        id: {
          type: "string",
          example: "1",
          description: "ID of the deleted playlist team",
        },
      },
    },
  },
};
