import { BaseModel, ModelFactory } from "../../package/src/engine/index.js";
import sequelize from "../../config/database.js";

class User extends BaseModel {
  static get fillable() {
    return ["email", "password", "role", "status"];
  }

  static get hidden() {
    return ["password"];
  }

  static get casts() {
    return {
      role: "string",
      status: "string",
    };
  }

  static get scopes() {
    return {
      withPassword: {
        attributes: { exclude: [] }, // Include all attributes including password
      },
    };
  }

  static associate(models) {
    this.hasMany(models.Note, {
      foreignKey: "user_id",
      as: "notes",
    });
  }
}

export default ModelFactory.register(User, sequelize, {
  tableName: "users",
});
