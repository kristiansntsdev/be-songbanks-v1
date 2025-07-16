'use strict';

const { ulid } = require('ulid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('playlists', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING(26),
        defaultValue: () => ulid()
      },
      playlist_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      sharable_link: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      playlist_team_id: {
        type: Sequelize.STRING(26),
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
    await queryInterface.addIndex('playlists', ['playlist_name'], {
      name: 'idx_playlists_name'
    });
    
    await queryInterface.addIndex('playlists', ['playlist_team_id'], {
      name: 'idx_playlists_team_id'
    });
    
    await queryInterface.addIndex('playlists', ['sharable_link'], {
      name: 'idx_playlists_sharable_link'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('playlists');
  }
};