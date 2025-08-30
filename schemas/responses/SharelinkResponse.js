export default {
  type: "object",
  properties: {
    code: {
      type: "integer",
      example: 201,
    },
    message: {
      type: "string",
      example: "Sharelink generated successfully",
    },
    data: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Playlist ID",
          example: "123",
        },
        playlist_name: {
          type: "string",
          description: "Name of the playlist",
          example: "My Awesome Playlist",
        },
        sharable_link: {
          type: "string",
          description: "Shareable link URL for joining the playlist team",
          example: "http://localhost:3000/playlist/join/abc123token",
        },
        share_token: {
          type: "string",
          description: "Unique share token for the playlist",
          example: "abc123token",
        },
        is_shared: {
          type: "boolean",
          description: "Whether the playlist is shared",
          example: true,
        },
        playlist_team_id: {
          type: "integer",
          description: "ID of the created playlist team",
          example: 456,
        },
      },
      required: [
        "id",
        "playlist_name",
        "sharable_link",
        "share_token",
        "is_shared",
        "playlist_team_id",
      ],
    },
  },
};
