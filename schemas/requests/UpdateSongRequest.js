export default {
  type: "object",
  properties: {
    title: {
      type: "string",
      example: "Amazing Grace (Updated)",
      description: "Updated title of the song",
    },
    artist: {
      type: "string",
      example: "John Newton",
      description: "Updated artist or composer of the song",
    },
    base_chord: {
      type: "string",
      example: "C",
      description: "Updated base chord of the song",
    },
    lyrics_and_chords: {
      type: "string",
      example: "Amazing grace how sweet the sound...",
      description: "Updated lyrics with chord progressions",
    },
    tag_names: {
      type: "array",
      items: {
        type: "string",
      },
      example: ["Gospel", "Contemporary"],
      description:
        "Updated array of tag names. If a tag doesn't exist, it will be created automatically",
    },
  },
};
