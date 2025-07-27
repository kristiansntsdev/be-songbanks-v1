"use strict";

const { ulid } = require("ulid");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("song_tags", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING(26),
        defaultValue: () => ulid(),
      },
      song_id: {
        type: Sequelize.STRING(26),
        allowNull: false,
        references: {
          model: "songs",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      tag_id: {
        type: Sequelize.STRING(26),
        allowNull: false,
        references: {
          model: "tags",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
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
    await queryInterface.addIndex("song_tags", ["song_id"], {
      name: "idx_song_tags_song_id",
    });

    await queryInterface.addIndex("song_tags", ["tag_id"], {
      name: "idx_song_tags_tag_id",
    });

    // Add unique constraint to prevent duplicate tag assignments
    await queryInterface.addIndex("song_tags", ["song_id", "tag_id"], {
      unique: true,
      name: "unique_song_tag",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("song_tags");
  },
};
