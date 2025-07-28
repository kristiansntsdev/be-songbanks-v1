import { BaseModel, ModelFactory } from "../../package/src/engine/index.js";
import sequelize from "../../config/database.js";

class Playlist extends BaseModel {
  static get fillable() {
    return [
      "playlist_name",
      "sharable_link",
      "share_token",
      "user_id",
      "playlist_team_id",
      "is_shared",
      "is_locked",
    ];
  }

  static get hidden() {
    return [];
  }

  static get casts() {
    return {
      is_shared: "boolean",
      is_locked: "boolean",
    };
  }

  static associate(models) {
    this.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "owner",
    });

    this.belongsTo(models.PlaylistTeam, {
      foreignKey: "playlist_team_id",
      as: "team",
    });

    this.belongsToMany(models.Song, {
      through: "playlist_songs",
      foreignKey: "playlist_id",
      otherKey: "song_id",
      as: "songs",
      withPivot: ["order_index"],
    });
  }
}

export default ModelFactory.register(Playlist, sequelize, {
  tableName: "playlists",
});
