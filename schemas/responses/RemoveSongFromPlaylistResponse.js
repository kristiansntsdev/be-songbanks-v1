/**
 * @swagger
 * components:
 *   schemas:
 *     RemoveSongFromPlaylistResponse:
 *       type: object
 *       properties:
 *         code:
 *           type: integer
 *           example: 200
 *           description: HTTP status code
 *         message:
 *           type: string
 *           example: "Song removed from playlist successfully"
 *           description: Success message
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
 *               example: [21, 45]
 *               description: Updated array of all remaining song IDs in the playlist
 *             songs_count:
 *               type: integer
 *               example: 2
 *               description: Total number of songs remaining in the playlist
 *             removed_song_id:
 *               type: integer
 *               example: 67
 *               description: ID of the song that was removed
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
 *         message: "Song removed from playlist successfully"
 *         data:
 *           id: "34"
 *           playlist_name: "My Favorite Songs"
 *           user_id: 544
 *           songs: [21, 45]
 *           songs_count: 2
 *           removed_song_id: 67
 *           createdAt: "2025-08-30T07:12:48.000Z"
 *           updatedAt: "2025-08-30T10:30:15.000Z"
 */

const RemoveSongFromPlaylistResponse = {
  type: "object",
  properties: {
    code: {
      type: "integer",
      example: 200,
    },
    message: {
      type: "string",
      example: "Song removed from playlist successfully",
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
          example: [21, 45],
        },
        songs_count: {
          type: "integer",
          example: 2,
        },
        removed_song_id: {
          type: "integer",
          example: 67,
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
        "removed_song_id",
        "createdAt",
        "updatedAt",
      ],
    },
  },
  required: ["code", "message", "data"],
};

export default RemoveSongFromPlaylistResponse;
