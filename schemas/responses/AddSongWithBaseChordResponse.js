/**
 * @swagger
 * components:
 *   schemas:
 *     AddSongWithBaseChordResponse:
 *       type: object
 *       properties:
 *         code:
 *           type: integer
 *           example: 200
 *           description: HTTP status code
 *         message:
 *           type: string
 *           example: "Song added to playlist with base chord successfully"
 *           description: Success message
 *         data:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               example: "1"
 *               description: Playlist ID
 *             playlist_name:
 *               type: string
 *               example: "My Favorite Songs"
 *               description: Name of the playlist
 *             user_id:
 *               type: integer
 *               example: 1
 *               description: ID of the playlist owner
 *             songs:
 *               type: array
 *               items:
 *                 type: integer
 *               example: [1, 2, 3]
 *               description: Array of all song IDs in the playlist
 *             playlist_notes:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   song_id:
 *                     type: integer
 *                     example: 1
 *                     description: ID of the song
 *                   base_chord:
 *                     type: string
 *                     example: "E"
 *                     description: Base chord chosen for this song
 *                 required: ["song_id", "base_chord"]
 *               example: [
 *                 { "song_id": 1, "base_chord": "E" },
 *                 { "song_id": 2, "base_chord": "Am" }
 *               ]
 *               description: Notes containing base chord selections for songs
 *             songs_count:
 *               type: integer
 *               example: 3
 *               description: Total number of songs in the playlist
 *             added_song_id:
 *               type: integer
 *               example: 1
 *               description: ID of the song that was added
 *             base_chord:
 *               type: string
 *               example: "E"
 *               description: Base chord that was set for the added song
 *             createdAt:
 *               type: string
 *               format: date-time
 *               example: "2024-01-15T10:30:00.000Z"
 *               description: Playlist creation timestamp
 *             updatedAt:
 *               type: string
 *               format: date-time
 *               example: "2024-01-15T14:22:00.000Z"
 *               description: Playlist last update timestamp
 *           required: [
 *             "id",
 *             "playlist_name",
 *             "user_id",
 *             "songs",
 *             "playlist_notes",
 *             "songs_count",
 *             "added_song_id",
 *             "base_chord",
 *             "createdAt",
 *             "updatedAt"
 *           ]
 *       example:
 *         code: 200
 *         message: "Song added to playlist with base chord successfully"
 *         data:
 *           id: "1"
 *           playlist_name: "My Favorite Songs"
 *           user_id: 1
 *           songs: [1, 2, 3]
 *           playlist_notes: [
 *             { "song_id": 1, "base_chord": "Am" },
 *             { "song_id": 2, "base_chord": "G" },
 *             { "song_id": 3, "base_chord": "E" }
 *           ]
 *           songs_count: 3
 *           added_song_id: 3
 *           base_chord: "E"
 *           createdAt: "2024-01-15T10:30:00.000Z"
 *           updatedAt: "2024-01-15T14:22:00.000Z"
 */

const AddSongWithBaseChordResponse = {
  type: "object",
  properties: {
    code: {
      type: "integer",
      example: 200,
    },
    message: {
      type: "string",
      example: "Song added to playlist with base chord successfully",
    },
    data: {
      type: "object",
      properties: {
        id: {
          type: "string",
          example: "1",
        },
        playlist_name: {
          type: "string",
          example: "My Favorite Songs",
        },
        user_id: {
          type: "integer",
          example: 1,
        },
        songs: {
          type: "array",
          items: {
            type: "integer",
          },
          example: [1, 2, 3],
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
        },
        songs_count: {
          type: "integer",
          example: 3,
        },
        added_song_id: {
          type: "integer",
          example: 1,
        },
        base_chord: {
          type: "string",
          example: "E",
        },
        createdAt: {
          type: "string",
          format: "date-time",
          example: "2024-01-15T10:30:00.000Z",
        },
        updatedAt: {
          type: "string",
          format: "date-time",
          example: "2024-01-15T14:22:00.000Z",
        },
      },
      required: [
        "id",
        "playlist_name",
        "user_id",
        "songs",
        "playlist_notes",
        "songs_count",
        "added_song_id",
        "base_chord",
        "createdAt",
        "updatedAt",
      ],
    },
  },
  required: ["code", "message", "data"],
};

export default AddSongWithBaseChordResponse;
