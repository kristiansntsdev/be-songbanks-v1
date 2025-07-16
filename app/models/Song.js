const { Sequelize, DataTypes } = require('sequelize');
const { ulid } = require('ulid');
const sequelize = require('../../config/database');

const Song = sequelize.define('users', {
		id: {
			type: DataTypes.STRING(26),
			primaryKey: true,
			allowNull: false,
			defaultValue: () => ulid()
		},
		title: {
			type: DataTypes.STRING,
			allowNull: true
		},
		artist: {
			type: DataTypes.STRING,
			allowNull: true
		},
		tags: {
			type: DataTypes.ARRAY,
			allowNull: false,
			defaultValue: 'member'
		},
		status: {
			type: DataTypes.ENUM('active', 'pending', 'request', 'suspend'),
			allowNull: false,
			defaultValue: 'active'
		}
  	},
	{
		indexes: [
			// Create a unique index on email
			{
				unique: true,
				fields: ['email']
			},
			// Create index on role for performance
			{
				fields: ['role']
			}],
	});

module.exports = User;