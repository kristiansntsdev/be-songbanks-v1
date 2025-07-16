const { Sequelize, DataTypes } = require('sequelize');
const { ulid } = require('ulid');
const sequelize = require('../../config/database');

const Song = sequelize.define('songs', {
		id: {
			type: DataTypes.STRING(26),
			primaryKey: true,
			allowNull: false,
			defaultValue: () => ulid()
		},
		title: {
			type: DataTypes.STRING,
			allowNull: false
		},
		artist: {
			type: DataTypes.STRING,
			allowNull: false
		},
		base_chord: {
			type: DataTypes.STRING,
			allowNull: true
		},
		lyrics_and_chords: {
			type: DataTypes.TEXT,
			allowNull: true
		}
  	},
	{
		indexes: [
			// Add indexes for optimal performance
			{
				fields: ['title']
			},
			{
				fields: ['artist']
			},
			{
				fields: ['base_chord']
			}
		]
	});

// Define associations if needed
Song.associate = (models) => {
	Song.belongsToMany(models.Tag, {through: 'song_tags', foreignKey: 'song_id'});
};

module.exports = Song;