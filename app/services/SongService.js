const { Op } = require('sequelize');
const Song = require('../models/Song');
const Tag = require('../models/Tag');
const Note = require('../models/Note');

class SongService {
    static async getAllSongs(options = {}) {
        const {
            page = 1,
            limit = 10,
            search,
            artist,
            baseChord,
            tags,
            sortBy = 'createdAt',
            sortOrder = 'DESC'
        } = options;

        const { count, rows } = await Song.query()
            .with(['tags:name,description', 'notes:id,content,user_id,createdAt'])
            .when(search, q => q.search(search, ['title', 'artist', 'lyrics_and_chords']))
            .when(artist, q => q.where('artist', 'like', `%${artist}%`))
            .when(baseChord, q => q.where('base_chord', baseChord))
            .when(tags && tags.length > 0, q => q.with({
                model: Tag,
                as: 'tags',
                where: { name: { [Op.in]: tags } },
                required: true,
                through: { attributes: [] }
            }))
            .orderBy(sortBy, sortOrder)
            .paginate(page, limit)
            .applyOptions({ distinct: true });

        return this.paginatedResponse(rows, count, page, limit, 'songs');
    }

    static async getSongById(songId) {
        const song = await Song.query()
            .with(['tags:name,description', 'notes:id,content,user_id,createdAt'])
            .findByPk(songId);

        if (!song) throw new Error('Song not found');
        return song;
    }

    static async createSong(songData, userId) {
        const { tags: tagNames, ...songAttributes } = songData;

        const song = await Song.create({
            ...songAttributes,
            created_by: userId
        });

        if (tagNames && tagNames.length > 0) {
            await this.attachTags(song.id, tagNames);
        }

        return this.getSongById(song.id);
    }

    static async updateSong(songId, updateData, userId) {
        const song = await this.validateSongExists(songId);
        await this.validateSongOwnership(song, userId);
        
        const { tags: tagNames, ...songAttributes } = updateData;
        
        await song.update(songAttributes);
        
        if (tagNames !== undefined) {
            await this.syncTags(songId, tagNames);
        }
        
        return this.getSongById(songId);
    }

    static async deleteSong(songId, userId) {
        const song = await this.validateSongExists(songId);
        await this.validateSongOwnership(song, userId);
        
        await song.destroy();
        return { message: 'Song deleted successfully' };
    }

    static async searchByChords(chordProgression) {
        return Song.query()
            .where('lyrics_and_chords', 'like', `%${chordProgression}%`)
            .with('tags:name,description')
            .get();
    }

    static async getSongsByArtist(artistName) {
        return Song.query()
            .where('artist', 'like', `%${artistName}%`)
            .with('tags:name,description')
            .orderBy('title', 'ASC')
            .get();
    }

    static async attachTags(songId, tagNames) {
        const song = await this.validateSongExists(songId);
        const tags = await this.findOrCreateTags(tagNames);
        await song.addTags(tags);
    }

    static async syncTags(songId, tagNames) {
        const song = await this.validateSongExists(songId);
        
        if (tagNames.length === 0) {
            await song.setTags([]);
            return;
        }

        const tags = await this.findOrCreateTags(tagNames);
        await song.setTags(tags);
    }

    static async getPopularSongs(limit = 10) {
        const { fn, col, literal } = require('sequelize');
        
        return Song.query()
            .with([
                { model: Note, as: 'notes', attributes: [] },
                'tags:name,description'
            ])
            .applyOptions({
                attributes: {
                    include: [[fn('COUNT', col('notes.id')), 'notesCount']]
                },
                group: ['Song.id'],
                order: [[literal('notesCount'), 'DESC']]
            })
            .limit(limit)
            .get();
    }

    // Helper methods
    static async validateSongExists(songId) {
        const song = await Song.findByPk(songId);
        if (!song) throw new Error('Song not found');
        return song;
    }

    static async validateSongOwnership(song, userId) {
        if (song.created_by !== userId) {
            throw new Error('Unauthorized to modify this song');
        }
    }

    static async findOrCreateTags(tagNames) {
        return Promise.all(
            tagNames.map(async (tagName) => {
                const { instance: tag } = await Tag.firstOrCreate({ name: tagName.trim() });
                return tag;
            })
        );
    }

    static paginatedResponse(rows, count, page, limit, key = 'items') {
        return {
            [key]: rows,
            pagination: this.buildPagination(count, page, limit)
        };
    }

    static buildPagination(count, page, limit) {
        return {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit),
            hasNextPage: page * limit < count,
            hasPrevPage: page > 1
        };
    }
}

module.exports = SongService;