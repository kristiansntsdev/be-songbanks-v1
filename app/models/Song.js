import { BaseModel, ModelFactory } from "../../package/src/engine/index.js";
import sequelize from "../../config/database.js";

class Song extends BaseModel {
  static get fillable() {
    return ["title", "artist", "base_chord", "lyrics_and_chords"];
  }

  static get hidden() {
    return [];
  }

  static get casts() {
    return {};
  }

  static associate(models) {
    this.belongsToMany(models.Tag, {
      through: "song_tags",
      foreignKey: "song_id",
      otherKey: "tag_id",
      as: "tags",
    });

    this.hasMany(models.Note, {
      foreignKey: "song_id",
      as: "notes",
    });
  }
}

export default ModelFactory.register(Song, sequelize, {
  tableName: "songs",
});
