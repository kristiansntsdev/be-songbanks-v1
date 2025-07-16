const { Sequelize, DataTypes } = require('sequelize');
const { ulid } = require('ulid');
const sequelize = require('../../config/database');

const User = sequelize.define('users', {
		id: {
			type: DataTypes.STRING(26),
			primaryKey: true,
			allowNull: false,
			defaultValue: () => ulid()
		},
		email: {
			type: DataTypes.STRING,
			allowNull: false
		},
		password: {
			type: DataTypes.STRING,
			allowNull: false
		},
		role: {
			type: DataTypes.ENUM('admin', 'member', 'guest'),
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