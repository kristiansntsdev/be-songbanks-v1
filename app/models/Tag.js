const { BaseModel, ModelFactory } = require('../../package/src/engine');
const sequelize = require('../../config/database');

class Tag extends BaseModel {
    static get fillable() {
        return ['name', 'description'];
    }

    // Hide sensitive data from JSON
    static get hidden() {
        return [];
    }

    // Type casting
    static get casts() {
        return {};
    }

    // Query scopes
    // Model relationships
    static associate(models) {
        this.belongsToMany(models.Song, {
            through: 'song_tags',
            foreignKey: 'tag_id',
            otherKey: 'song_id',
            as: 'songs'
        });
    }
}

module.exports = ModelFactory.register(Tag, sequelize, {
    tableName: 'tags'
});