export default {
  type: "object",
  properties: {
    playlist_name: {
      type: "string",
      example: "Updated Playlist Name",
      description: "Updated name of the playlist",
    },
    songs: {
      type: "array",
      items: {
        type: "string",
      },
      example: ["01HPQR2ST3UV4WXY5Z6789ABCD", "01HPQR2ST3UV4WXY5Z6789ABCE"],
      description: "Updated array of song IDs for the playlist",
    },
  },
};
