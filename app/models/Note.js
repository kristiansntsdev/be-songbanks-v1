import { BaseModel, ModelFactory } from "../../package/src/engine/index.js";
import sequelize from "../../config/database.js";

class Note extends BaseModel {
  static get fillable() {
    return ["user_id", "song_id", "notes"];
  }

  static get hidden() {
    return [];
  }

  static get casts() {
    return {};
  }

  static associate(models) {
    this.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });

    this.belongsTo(models.Song, {
      foreignKey: "song_id",
      as: "song",
    });
  }
}

export default ModelFactory.register(Note, sequelize, {
  tableName: "notes",
});
