/**
 * @swagger
 * components:
 *   schemas:
 *     AddSongToPlaylistRequest:
 *       type: object
 *       required:
 *         - songIds
 *       properties:
 *         songIds:
 *           oneOf:
 *             - type: integer
 *               minimum: 1
 *               description: Single song ID to add to playlist
 *               example: 21
 *             - type: array
 *               items:
 *                 type: integer
 *                 minimum: 1
 *               minItems: 1
 *               description: Array of song IDs to add to playlist
 *               example: [21, 45, 67]
 *           description: Either a single song ID (integer) or an array of song IDs to add to the playlist
 *       example:
 *         songIds: [21, 45, 67]
 */

const AddSongToPlaylistRequest = {
  type: "object",
  required: ["songIds"],
  properties: {
    songIds: {
      oneOf: [
        {
          type: "integer",
          minimum: 1,
          description: "Single song ID to add to playlist",
        },
        {
          type: "array",
          items: {
            type: "integer",
            minimum: 1,
          },
          minItems: 1,
          description: "Array of song IDs to add to playlist",
        },
      ],
      description:
        "Either a single song ID (integer) or an array of song IDs to add to the playlist",
    },
  },
  additionalProperties: false,
};

export default AddSongToPlaylistRequest;
