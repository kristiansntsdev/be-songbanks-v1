import { BaseModel, ModelFactory } from "../../package/src/engine/index.js";
import sequelize from "../../config/database.js";

class Tag extends BaseModel {
  static get fillable() {
    return ["name", "description"];
  }

  // Hide sensitive data from JSON
  static get hidden() {
    return [];
  }

  // Type casting
  static get casts() {
    return {};
  }

  // Query scopes
  // Model relationships
  static associate(models) {
    this.belongsToMany(models.Song, {
      through: "song_tags",
      foreignKey: "tag_id",
      otherKey: "song_id",
      as: "songs",
    });
  }
}

export default ModelFactory.register(Tag, sequelize, {
  tableName: "tags",
  underscored: true,
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});
