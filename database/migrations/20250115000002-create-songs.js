"use strict";

const { ulid } = require("ulid");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("songs", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING(26),
        defaultValue: () => ulid(),
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      artist: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      base_chord: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      lyrics_and_chords: {
        type: Sequelize.TEXT,
        allowNull: true,
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
    await queryInterface.addIndex("songs", ["title"], {
      name: "idx_songs_title",
    });

    // Add JSON index for artist searches (MySQL/MariaDB specific)
    await queryInterface.sequelize.query(`
      ALTER TABLE songs ADD INDEX idx_artist_json ((CAST(artist AS CHAR(255)) COLLATE utf8mb4_bin))
    `);

    await queryInterface.addIndex("songs", ["base_chord"], {
      name: "idx_songs_base_chord",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("songs");
  },
};
