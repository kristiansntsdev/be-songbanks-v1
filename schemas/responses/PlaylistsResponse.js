export default {
  type: "object",
  properties: {
    code: {
      type: "integer",
      example: 200,
    },
    message: {
      type: "string",
      example: "Playlists retrieved successfully",
    },
    data: {
      type: "array",
      items: {
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
          songs_count: {
            type: "integer",
            example: 5,
            description: "Number of songs in the playlist",
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
      description: "Array of playlists",
    },
    pagination: {
      type: "object",
      properties: {
        currentPage: {
          type: "integer",
          example: 1,
          description: "Current page number",
        },
        totalPages: {
          type: "integer",
          example: 3,
          description: "Total number of pages",
        },
        totalItems: {
          type: "integer",
          example: 25,
          description: "Total number of playlists",
        },
        itemsPerPage: {
          type: "integer",
          example: 10,
          description: "Number of items per page",
        },
        hasNextPage: {
          type: "boolean",
          example: true,
          description: "Whether there is a next page",
        },
        hasPrevPage: {
          type: "boolean",
          example: false,
          description: "Whether there is a previous page",
        },
      },
      description: "Pagination information",
    },
  },
};
