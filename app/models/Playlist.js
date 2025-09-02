import { BaseModel, ModelFactory } from "../../package/src/engine/index.js";
import { DataTypes } from "sequelize";
import sequelize from "../../config/database.js";

class Playlist extends BaseModel {
  static get schema() {
    return {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      playlist_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      sharable_link: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      share_token: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      playlist_team_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      is_shared: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      is_locked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      songs: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      playlist_notes: {
        type: DataTypes.JSON,
        defaultValue: null,
      },
      createdAt: {
        type: DataTypes.DATE,
        field: "createdAt",
      },
      updatedAt: {
        type: DataTypes.DATE,
        field: "updatedAt",
      },
    };
  }
  static get fillable() {
    return [
      "playlist_name",
      "sharable_link",
      "share_token",
      "user_id",
      "playlist_team_id",
      "is_shared",
      "is_locked",
      "songs",
      "playlist_notes",
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
  }
}

export default ModelFactory.register(Playlist, sequelize, {
  tableName: "playlists",
});
