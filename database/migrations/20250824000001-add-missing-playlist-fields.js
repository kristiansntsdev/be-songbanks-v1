"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add missing fields to playlists table
    await queryInterface.addColumn("playlists", "share_token", {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    await queryInterface.addColumn("playlists", "user_id", {
      type: Sequelize.STRING(26),
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    });

    await queryInterface.addColumn("playlists", "is_shared", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn("playlists", "is_locked", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    // Add indexes for the new fields
    await queryInterface.addIndex("playlists", ["user_id"], {
      name: "idx_playlists_user_id",
    });

    await queryInterface.addIndex("playlists", ["share_token"], {
      name: "idx_playlists_share_token",
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex("playlists", "idx_playlists_user_id");
    await queryInterface.removeIndex("playlists", "idx_playlists_share_token");

    // Remove the added columns
    await queryInterface.removeColumn("playlists", "share_token");
    await queryInterface.removeColumn("playlists", "user_id");
    await queryInterface.removeColumn("playlists", "is_shared");
    await queryInterface.removeColumn("playlists", "is_locked");
  },
};
