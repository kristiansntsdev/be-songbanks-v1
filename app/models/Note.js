const { DataTypes } = require('sequelize');
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
        references: {
            model: 'users',
            key: 'id'
        },
        allowNull: false
    },
    song_id: {
        type: DataTypes.STRING,
        references: {
            model: 'songs',
            key: 'id'
        },
        allowNull: false
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    indexes: [
        // Add your indexes here
        // Example:
        // {
        //     fields: ['name']
        // }
    ]
});

module.exports = Note;