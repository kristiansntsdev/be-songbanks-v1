'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add foreign key constraint for playlist_team_id in playlists table
    await queryInterface.addConstraint('playlists', {
      fields: ['playlist_team_id'],
      type: 'foreign key',
      name: 'fk_playlists_playlist_team_id',
      references: {
        table: 'playlist_teams',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add foreign key constraint for playlist_id in playlist_teams table
    await queryInterface.addConstraint('playlist_teams', {
      fields: ['playlist_id'],
      type: 'foreign key',
      name: 'fk_playlist_teams_playlist_id',
      references: {
        table: 'playlists',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove foreign key constraints
    await queryInterface.removeConstraint('playlist_teams', 'fk_playlist_teams_playlist_id');
    await queryInterface.removeConstraint('playlists', 'fk_playlists_playlist_team_id');
  }
};