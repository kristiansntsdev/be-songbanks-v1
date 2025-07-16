const { Sequelize, DataTypes } = require('sequelize');
const { ulid } = require('ulid');
const sequelize = require('../../config/database');

const Note = sequelize.define('notes', {
		id: {
			type: DataTypes.STRING(26),
			primaryKey: true,
			allowNull: false,
			defaultValue: () => ulid()
		},
		user_id: {
			type: DataTypes.STRING,
            referrences: {
                model: 'users',
                key: 'id'
            },
			allowNull: false
		},
		song_id: {
			type: DataTypes.STRING,
            referrences: {
                model: 'songs',
                key: 'id'
            },
			allowNull: false
		},
		notes: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
  	},
	{
		indexes: [
            // Create index on user_id for performance
			{
				fields: ['user_id']
			},
			// Create index on role for performance
			{
				fields: ['song_id']
			}],
	});

module.exports = User;