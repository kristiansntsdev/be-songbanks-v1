export default {
  type: "object",
  properties: {
    code: {
      type: "integer",
      example: 200,
    },
    message: {
      type: "string",
      example: "Playlist teams retrieved successfully",
    },
    data: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: {
            type: "integer",
            example: 1,
            description: "Unique identifier for the playlist team",
          },
          playlist_id: {
            type: "integer",
            example: 34,
            description: "ID of the associated playlist",
          },
          lead_id: {
            type: "integer",
            example: 544,
            description: "ID of the team leader",
          },
          is_hidden: {
            type: "integer",
            example: 0,
            description: "Team visibility flag (0=visible, 1=hidden)",
          },
          members: {
            type: "string",
            example: "[1,2,3]",
            description: "JSON array string of member user IDs",
          },
          playlist: {
            type: "object",
            properties: {
              id: {
                type: "integer",
                example: 34,
              },
              playlist_name: {
                type: "string",
                example: "Team Playlist",
              },
            },
            description: "Associated playlist details",
          },
          leader: {
            type: "object",
            properties: {
              id: {
                type: "integer",
                example: 544,
              },
              email: {
                type: "string",
                example: "leader@example.com",
              },
            },
            description: "Team leader details",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2025-08-30T07:13:03.000Z",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2025-08-30T07:28:55.000Z",
          },
        },
      },
      description: "Array of playlist teams where the user is the leader",
    },
  },
};
