/**
 * @swagger
 * components:
 *   schemas:
 *     AddSongToPlaylistResponse:
 *       type: object
 *       properties:
 *         code:
 *           type: integer
 *           example: 200
 *           description: HTTP status code
 *         message:
 *           type: string
 *           example: "Song added to playlist successfully"
 *           description: Success message - varies for single vs multiple songs
 *         data:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               example: "34"
 *               description: Playlist ID
 *             playlist_name:
 *               type: string
 *               example: "My Favorite Songs"
 *               description: Name of the playlist
 *             user_id:
 *               type: integer
 *               example: 544
 *               description: ID of the playlist owner
 *             songs:
 *               type: array
 *               items:
 *                 type: integer
 *               example: [21, 45, 67]
 *               description: Updated array of all song IDs in the playlist
 *             songs_count:
 *               type: integer
 *               example: 3
 *               description: Total number of songs in the playlist
 *             added_song_ids:
 *               type: array
 *               items:
 *                 type: integer
 *               example: [67]
 *               description: Array of song IDs that were successfully added
 *             duplicate_song_ids:
 *               type: array
 *               items:
 *                 type: integer
 *               example: [21]
 *               description: Array of song IDs that were already in playlist (optional)
 *             added_song_id:
 *               type: integer
 *               example: 67
 *               description: Single song ID that was added (only present for single song operations)
 *             total_requested:
 *               type: integer
 *               example: 2
 *               description: Total number of songs requested to be added
 *             successfully_added:
 *               type: integer
 *               example: 1
 *               description: Number of songs that were actually added
 *             createdAt:
 *               type: string
 *               format: date-time
 *               example: "2025-08-30T07:12:48.000Z"
 *               description: Playlist creation timestamp
 *             updatedAt:
 *               type: string
 *               format: date-time
 *               example: "2025-08-30T10:30:15.000Z"
 *               description: Playlist last update timestamp
 *       example:
 *         code: 200
 *         message: "1 song(s) added to playlist successfully"
 *         data:
 *           id: "34"
 *           playlist_name: "My Favorite Songs"
 *           user_id: 544
 *           songs: [21, 45, 67]
 *           songs_count: 3
 *           added_song_ids: [67]
 *           duplicate_song_ids: [21]
 *           total_requested: 2
 *           successfully_added: 1
 *           createdAt: "2025-08-30T07:12:48.000Z"
 *           updatedAt: "2025-08-30T10:30:15.000Z"
 */

const AddSongToPlaylistResponse = {
  type: "object",
  properties: {
    code: {
      type: "integer",
      example: 200,
    },
    message: {
      type: "string",
      example: "Song added to playlist successfully",
    },
    data: {
      type: "object",
      properties: {
        id: {
          type: "string",
          example: "34",
        },
        playlist_name: {
          type: "string",
          example: "My Favorite Songs",
        },
        user_id: {
          type: "integer",
          example: 544,
        },
        songs: {
          type: "array",
          items: {
            type: "integer",
          },
          example: [21, 45, 67],
        },
        songs_count: {
          type: "integer",
          example: 3,
        },
        added_song_ids: {
          type: "array",
          items: {
            type: "integer",
          },
          example: [67],
        },
        duplicate_song_ids: {
          type: "array",
          items: {
            type: "integer",
          },
          example: [21],
        },
        added_song_id: {
          type: "integer",
          example: 67,
        },
        total_requested: {
          type: "integer",
          example: 2,
        },
        successfully_added: {
          type: "integer",
          example: 1,
        },
        createdAt: {
          type: "string",
          format: "date-time",
          example: "2025-08-30T07:12:48.000Z",
        },
        updatedAt: {
          type: "string",
          format: "date-time",
          example: "2025-08-30T10:30:15.000Z",
        },
      },
      required: [
        "id",
        "playlist_name",
        "user_id",
        "songs",
        "songs_count",
        "added_song_ids",
        "total_requested",
        "successfully_added",
        "createdAt",
        "updatedAt",
      ],
    },
  },
  required: ["code", "message", "data"],
};

export default AddSongToPlaylistResponse;
