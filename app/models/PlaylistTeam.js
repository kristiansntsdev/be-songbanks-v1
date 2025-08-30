import { DataTypes } from "sequelize";
import sequelize from "../../config/database.js";

class PlaylistTeam {
  static get schema() {
    return {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      playlist_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      lead_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      is_hidden: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      members: {
        type: DataTypes.JSON,
        defaultValue: [],
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
    return ["playlist_id", "lead_id", "is_hidden", "members"];
  }

  static get hidden() {
    return [];
  }

  static get casts() {
    return {
      is_hidden: "boolean",
      members: "json",
    };
  }

  static associate(models) {
    this.belongsTo(models.Playlist, {
      foreignKey: "playlist_id",
      as: "playlist",
    });

    this.belongsTo(models.User, {
      foreignKey: "lead_id",
      as: "leader",
    });
  }
}

const PlaylistTeamModel = sequelize.define(
  "PlaylistTeam",
  PlaylistTeam.schema,
  {
    tableName: "playlist_teams",
    timestamps: true,
  }
);

export default PlaylistTeamModel;
