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
  	},
	{
		indexes: [
			// Create a unique index on email
			{
				unique: true,
				fields: ['email']
			}],
	});

module.exports = User;