/**
 * @swagger
 * components:
 *   schemas:
 *     AddSongWithBaseChordRequest:
 *       type: object
 *       required:
 *         - base_chord
 *       properties:
 *         base_chord:
 *           type: string
 *           minLength: 1
 *           maxLength: 10
 *           description: The base chord chosen by the user for this song
 *           example: "E"
 *       example:
 *         base_chord: "E"
 */

const AddSongWithBaseChordRequest = {
  type: "object",
  required: ["base_chord"],
  properties: {
    base_chord: {
      type: "string",
      minLength: 1,
      maxLength: 10,
      description: "The base chord chosen by the user for this song",
      example: "E",
    },
  },
  additionalProperties: false,
};

export default AddSongWithBaseChordRequest;
