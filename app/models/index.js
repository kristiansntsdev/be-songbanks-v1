import Song from "./Song.js";
import Tag from "./Tag.js";
import User from "./User.js";
import Note from "./Note.js";
import Playlist from "./Playlist.js";
import PlaylistTeam from "./PlaylistTeam.js";

// Create models object
const models = {
  Song,
  Tag,
  User,
  Note,
  Playlist,
  PlaylistTeam,
};

// Call associate methods if they exist
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

export default models;
export { Song, Tag, User, Note, Playlist, PlaylistTeam };
