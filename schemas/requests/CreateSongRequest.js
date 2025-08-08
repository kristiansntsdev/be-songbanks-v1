export default {
  type: "object",
  required: ["title", "artist"],
  properties: {
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
    tag_names: {
      type: "array",
      items: {
        type: "string",
      },
      example: ["Gospel", "Worship", "Contemporary"],
      description:
        "Array of tag names. If a tag doesn't exist, it will be created automatically",
    },
  },
};
