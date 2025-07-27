const { BaseModel, ModelFactory } = require("../../package/src/engine");
const sequelize = require("../../config/database");

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

module.exports = ModelFactory.register(User, sequelize, {
  tableName: "users",
});
