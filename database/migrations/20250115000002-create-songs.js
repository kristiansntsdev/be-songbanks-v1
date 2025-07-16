'use strict';

const { ulid } = require('ulid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('songs', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING(26),
        defaultValue: () => ulid()
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      artist: {
        type: Sequelize.STRING,
        allowNull: false
      },
      tags: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
      },
      base_chord: {
        type: Sequelize.STRING,
        allowNull: true
      },
      lyrics_and_chords: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add indexes for optimal performance
    await queryInterface.addIndex('songs', ['title'], {
      name: 'idx_songs_title'
    });
    
    await queryInterface.addIndex('songs', ['artist'], {
      name: 'idx_songs_artist'
    });
    
    await queryInterface.addIndex('songs', ['base_chord'], {
      name: 'idx_songs_base_chord'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('songs');
  }
};