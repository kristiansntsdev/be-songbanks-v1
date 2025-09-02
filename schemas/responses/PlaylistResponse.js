export default {
  type: "object",
  properties: {
    code: {
      type: "integer",
      example: 200,
    },
    message: {
      type: "string",
      example: "Playlist retrieved successfully",
    },
    data: {
      type: "object",
      properties: {
        id: {
          type: "string",
          example: "01HPQR2ST3UV4WXY5Z6789ABCD",
          description: "Unique identifier for the playlist",
        },
        playlist_name: {
          type: "string",
          example: "My Favorite Songs",
          description: "Name of the playlist",
        },
        user_id: {
          type: "string",
          example: "user123",
          description: "ID of the user who owns the playlist",
        },
        songs: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: {
                type: "string",
                example: "01HPQR2ST3UV4WXY5Z6789ABCD",
              },
              title: {
                type: "string",
                example: "Amazing Grace",
              },
              artist: {
                type: "string",
                example: "John Newton",
              },
              base_chord: {
                type: "string",
                example: "G",
              },
            },
          },
          description: "Array of songs in the playlist",
        },
        playlist_notes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              song_id: {
                type: "integer",
                example: 1,
              },
              base_chord: {
                type: "string",
                example: "E",
              },
            },
            required: ["song_id", "base_chord"],
          },
          example: [
            { song_id: 1, base_chord: "E" },
            { song_id: 2, base_chord: "Am" },
          ],
          description: "Notes containing base chord selections for songs",
        },
        createdAt: {
          type: "string",
          format: "date-time",
          example: "2024-01-15T10:30:00.000Z",
        },
        updatedAt: {
          type: "string",
          format: "date-time",
          example: "2024-01-15T10:30:00.000Z",
        },
      },
    },
  },
};
