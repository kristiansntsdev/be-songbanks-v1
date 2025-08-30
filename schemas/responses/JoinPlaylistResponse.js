export default {
  type: "object",
  properties: {
    code: {
      type: "integer",
      example: 201,
    },
    message: {
      type: "string",
      example: "Successfully joined playlist team as member",
    },
    data: {
      type: "object",
      properties: {
        playlist_team_id: {
          type: "integer",
          description: "ID of the created playlist team",
          example: 456,
        },
        playlist_id: {
          type: "integer",
          description: "ID of the playlist that was joined",
          example: 123,
        },
        playlist_name: {
          type: "string",
          description: "Name of the playlist",
          example: "My Awesome Playlist",
        },
        lead_id: {
          type: "integer",
          description: "User ID of the team leader (playlist creator)",
          example: 789,
        },
        joiner_id: {
          type: "integer",
          description: "User ID of the person who joined via sharelink",
          example: 456,
        },
        message: {
          type: "string",
          description: "Success message",
          example: "Successfully joined playlist team as member",
        },
        members: {
          type: "array",
          items: {
            type: "integer",
          },
          description: "Array of user IDs who are members of the team",
          example: [123, 456, 789],
        },
      },
      required: [
        "playlist_team_id",
        "playlist_id",
        "playlist_name",
        "lead_id",
        "joiner_id",
        "message",
        "members",
      ],
    },
  },
};
