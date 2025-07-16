'use strict';

const { ulid } = require('ulid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('playlist_teams', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING(26),
        defaultValue: () => ulid()
      },
      playlist_id: {
        type: Sequelize.STRING(26),
        allowNull: false
      },
      team_member_ids: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
      },
      lead_id: {
        type: Sequelize.STRING(26),
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
    await queryInterface.addIndex('playlist_teams', ['playlist_id'], {
      name: 'idx_playlist_teams_playlist_id'
    });
    
    await queryInterface.addIndex('playlist_teams', ['lead_id'], {
      name: 'idx_playlist_teams_lead_id'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('playlist_teams');
  }
};