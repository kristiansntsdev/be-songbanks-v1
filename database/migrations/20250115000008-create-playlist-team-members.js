"use strict";

const { ulid } = require("ulid");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("playlist_team_members", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING(26),
        defaultValue: () => ulid(),
      },
      playlist_team_id: {
        type: Sequelize.STRING(26),
        allowNull: false,
        references: {
          model: "playlist_teams",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      user_id: {
        type: Sequelize.STRING(26),
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      role: {
        type: Sequelize.ENUM("member", "admin"),
        allowNull: false,
        defaultValue: "member",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    // Add indexes for optimal performance
    await queryInterface.addIndex(
      "playlist_team_members",
      ["playlist_team_id"],
      {
        name: "idx_playlist_team_members_team_id",
      }
    );

    await queryInterface.addIndex("playlist_team_members", ["user_id"], {
      name: "idx_playlist_team_members_user_id",
    });

    // Add unique constraint to prevent duplicate team memberships
    await queryInterface.addIndex(
      "playlist_team_members",
      ["playlist_team_id", "user_id"],
      {
        unique: true,
        name: "unique_team_member",
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("playlist_team_members");
  },
};
