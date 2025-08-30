export default {
  type: "object",
  required: ["playlist_name"],
  properties: {
    playlist_name: {
      type: "string",
      example: "My Favorite Songs",
      description: "Name of the playlist",
    },
    songs: {
      type: "array",
      items: {
        type: "string",
      },
      example: ["01HPQR2ST3UV4WXY5Z6789ABCD"],
      description: "Array of song IDs to include in the playlist",
    },
  },
};
