export default {
  type: "object",
  properties: {
    code: {
      type: "integer",
      example: 200,
    },
    message: {
      type: "string",
      example: "Member removed from team successfully",
    },
    data: {
      type: "object",
      properties: {
        team_id: {
          type: "string",
          example: "1",
          description: "ID of the playlist team",
        },
        user_id: {
          type: "string",
          example: "123",
          description: "ID of the removed user",
        },
      },
    },
  },
};
