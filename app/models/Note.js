const { BaseModel, ModelFactory } = require("../../package/src/engine");
const sequelize = require("../../config/database");

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

module.exports = ModelFactory.register(Note, sequelize, {
  tableName: "notes",
});
