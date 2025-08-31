/**
 * @swagger
 * components:
 *   schemas:
 *     UpdatePlaylistRequest:
 *       type: object
 *       required:
 *         - playlist_name
 *       properties:
 *         playlist_name:
 *           type: string
 *           minLength: 1
 *           example: "Updated Playlist Name"
 *           description: "Updated name of the playlist"
 *       additionalProperties: false
 *       example:
 *         playlist_name: "My Updated Playlist"
 */

export default {
  type: "object",
  required: ["playlist_name"],
  properties: {
    playlist_name: {
      type: "string",
      minLength: 1,
      example: "Updated Playlist Name",
      description: "Updated name of the playlist",
    },
  },
  additionalProperties: false,
};
