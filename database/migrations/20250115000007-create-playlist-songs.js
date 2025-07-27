"use strict";

const { ulid } = require("ulid");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("playlist_songs", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING(26),
        defaultValue: () => ulid(),
      },
      playlist_id: {
        type: Sequelize.STRING(26),
        allowNull: false,
        references: {
          model: "playlists",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
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
      order_index: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
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
    await queryInterface.addIndex("playlist_songs", ["playlist_id"], {
      name: "idx_playlist_songs_playlist_id",
    });

    await queryInterface.addIndex("playlist_songs", ["song_id"], {
      name: "idx_playlist_songs_song_id",
    });

    // Add unique constraint to prevent duplicate songs in same playlist
    await queryInterface.addIndex(
      "playlist_songs",
      ["playlist_id", "song_id"],
      {
        unique: true,
        name: "unique_playlist_song",
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("playlist_songs");
  },
};
