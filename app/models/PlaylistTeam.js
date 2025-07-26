const { BaseModel, ModelFactory } = require('../../package/src/engine');
const sequelize = require('../../config/database');

class PlaylistTeam extends BaseModel {
    static get fillable() {
        return [
            'playlist_id',
            'lead_id',
            'is_hidden'
        ];
    }

    static get hidden() {
        return [];
    }

    static get casts() {
        return {
            'is_hidden': 'boolean'
        };
    }

    static associate(models) {
        this.belongsTo(models.Playlist, {
            foreignKey: 'playlist_id',
            as: 'playlist'
        });

        this.belongsTo(models.User, {
            foreignKey: 'lead_id',
            as: 'leader'
        });

        this.belongsToMany(models.User, {
            through: 'playlist_team_members',
            foreignKey: 'playlist_team_id',
            otherKey: 'user_id',
            as: 'members',
            withPivot: ['role']
        });
    }
}

module.exports = ModelFactory.register(PlaylistTeam, sequelize, {
    tableName: 'playlist_teams'
});