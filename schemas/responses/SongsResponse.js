export default {
  type: "object",
  properties: {
    code: {
      type: "integer",
      example: 200,
    },
    message: {
      type: "string",
      example: "Songs retrieved successfully",
    },
    data: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: {
            type: "string",
            example: "01HPQR2ST3UV4WXY5Z6789ABCD",
            description: "Unique identifier for the song",
          },
          title: {
            type: "string",
            example: "Amazing Grace",
            description: "Title of the song",
          },
          artist: {
            type: "string",
            example: "John Newton",
            description: "Artist or composer of the song",
          },
          base_chord: {
            type: "string",
            example: "G",
            description: "Base chord of the song",
          },
          lyrics_and_chords: {
            type: "string",
            example: "Amazing grace how sweet the sound...",
            description: "Lyrics with chord progressions",
          },
          tags: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  example: "01HPQR2ST3UV4WXY5Z6789ABCE",
                },
                name: {
                  type: "string",
                  example: "Gospel",
                },
                description: {
                  type: "string",
                  example: "Traditional gospel music",
                },
              },
            },
            description: "Tags associated with the song",
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
      description: "Array of songs",
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
          example: 5,
          description: "Total number of pages",
        },
        totalItems: {
          type: "integer",
          example: 42,
          description: "Total number of songs",
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
