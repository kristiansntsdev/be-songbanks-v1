const { Op } = require('sequelize');
const Song = require('../models/Song');
const Tag = require('../models/Tag');
const Note = require('../models/Note');

class SongService {
    /**
     * Get all songs with pagination and filters
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Paginated songs
     */
    static async getAllSongs(options = {}) {
        try {
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

            const offset = (page - 1) * limit;
            const where = {};
            const include = [
                {
                    model: Tag,
                    as: 'tags',
                    through: { attributes: [] }
                },
                {
                    model: Note,
                    as: 'notes',
                    attributes: ['id', 'content', 'user_id', 'createdAt']
                }
            ];

            // Add search filter
            if (search) {
                where[Op.or] = [
                    { title: { [Op.like]: `%${search}%` } },
                    { artist: { [Op.like]: `%${search}%` } },
                    { lyrics_and_chords: { [Op.like]: `%${search}%` } }
                ];
            }

            // Add artist filter
            if (artist) {
                where.artist = { [Op.like]: `%${artist}%` };
            }

            // Add base chord filter
            if (baseChord) {
                where.base_chord = baseChord;
            }

            // Add tag filter
            if (tags && tags.length > 0) {
                include[0].where = {
                    name: { [Op.in]: tags }
                };
                include[0].required = true;
            }

            const { count, rows } = await Song.findAndCountAll({
                where,
                include,
                limit: parseInt(limit),
                offset,
                order: [[sortBy, sortOrder]],
                distinct: true
            });

            return {
                songs: rows,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(count / limit),
                    totalItems: count,
                    itemsPerPage: parseInt(limit),
                    hasNextPage: page * limit < count,
                    hasPrevPage: page > 1
                }
            };
        } catch (error) {
            throw new Error(`Failed to retrieve songs: ${error.message}`);
        }
    }

    /**
     * Get song by ID with full details
     * @param {string} songId - Song ID
     * @returns {Promise<Object>} Song details
     */
    static async getSongById(songId) {
        try {
            const song = await Song.findByPk(songId, {
                include: [
                    {
                        model: Tag,
                        as: 'tags',
                        through: { attributes: [] }
                    },
                    {
                        model: Note,
                        as: 'notes',
                        attributes: ['id', 'content', 'user_id', 'createdAt']
                    }
                ]
            });

            if (!song) {
                throw new Error('Song not found');
            }

            return song;
        } catch (error) {
            throw new Error(`Failed to retrieve song: ${error.message}`);
        }
    }

    /**
     * Create a new song
     * @param {Object} songData - Song creation data
     * @param {string} userId - User ID creating the song
     * @returns {Promise<Object>} Created song
     */
    static async createSong(songData, userId) {
        try {
            const { tags: tagNames, ...songAttributes } = songData;

            // Create the song
            const song = await Song.create({
                ...songAttributes,
                created_by: userId
            });

            // Handle tags if provided
            if (tagNames && tagNames.length > 0) {
                await this.attachTags(song.id, tagNames);
            }

            // Return song with tags
            return await this.getSongById(song.id);
        } catch (error) {
            throw new Error(`Failed to create song: ${error.message}`);
        }
    }

    /**
     * Update an existing song
     * @param {string} songId - Song ID
     * @param {Object} updateData - Update data
     * @param {string} userId - User ID making the update
     * @returns {Promise<Object>} Updated song
     */
    static async updateSong(songId, updateData, userId) {
        try {
            const song = await Song.findByPk(songId);
            if (!song) {
                throw new Error('Song not found');
            }

            // Check ownership or admin rights (simplified - you might want more complex logic)
            if (song.created_by !== userId) {
                throw new Error('Unauthorized to update this song');
            }

            const { tags: tagNames, ...songAttributes } = updateData;

            // Update song attributes
            await song.update(songAttributes);

            // Handle tags if provided
            if (tagNames !== undefined) {
                await this.syncTags(songId, tagNames);
            }

            // Return updated song with tags
            return await this.getSongById(songId);
        } catch (error) {
            throw new Error(`Failed to update song: ${error.message}`);
        }
    }

    /**
     * Delete a song
     * @param {string} songId - Song ID
     * @param {string} userId - User ID requesting deletion
     * @returns {Promise<Object>} Success message
     */
    static async deleteSong(songId, userId) {
        try {
            const song = await Song.findByPk(songId);
            if (!song) {
                throw new Error('Song not found');
            }

            // Check ownership or admin rights
            if (song.created_by !== userId) {
                throw new Error('Unauthorized to delete this song');
            }

            await song.destroy();

            return {
                message: 'Song deleted successfully'
            };
        } catch (error) {
            throw new Error(`Failed to delete song: ${error.message}`);
        }
    }

    /**
     * Search songs by chord progression
     * @param {string} chordProgression - Chord progression to search
     * @returns {Promise<Array>} Matching songs
     */
    static async searchByChords(chordProgression) {
        try {
            const songs = await Song.findAll({
                where: {
                    lyrics_and_chords: {
                        [Op.like]: `%${chordProgression}%`
                    }
                },
                include: [
                    {
                        model: Tag,
                        as: 'tags',
                        through: { attributes: [] }
                    }
                ]
            });

            return songs;
        } catch (error) {
            throw new Error(`Failed to search songs by chords: ${error.message}`);
        }
    }

    /**
     * Get songs by artist
     * @param {string} artistName - Artist name
     * @returns {Promise<Array>} Songs by artist
     */
    static async getSongsByArtist(artistName) {
        try {
            const songs = await Song.findAll({
                where: {
                    artist: {
                        [Op.like]: `%${artistName}%`
                    }
                },
                include: [
                    {
                        model: Tag,
                        as: 'tags',
                        through: { attributes: [] }
                    }
                ],
                order: [['title', 'ASC']]
            });

            return songs;
        } catch (error) {
            throw new Error(`Failed to get songs by artist: ${error.message}`);
        }
    }

    /**
     * Attach tags to a song
     * @param {string} songId - Song ID
     * @param {Array} tagNames - Array of tag names
     * @returns {Promise<void>}
     */
    static async attachTags(songId, tagNames) {
        try {
            const song = await Song.findByPk(songId);
            if (!song) {
                throw new Error('Song not found');
            }

            // Find or create tags
            const tags = await Promise.all(
                tagNames.map(async (tagName) => {
                    const [tag] = await Tag.findOrCreate({
                        where: { name: tagName.trim() }
                    });
                    return tag;
                })
            );

            // Attach tags to song
            await song.addTags(tags);
        } catch (error) {
            throw new Error(`Failed to attach tags: ${error.message}`);
        }
    }

    /**
     * Sync tags for a song (replace existing tags)
     * @param {string} songId - Song ID
     * @param {Array} tagNames - Array of tag names
     * @returns {Promise<void>}
     */
    static async syncTags(songId, tagNames) {
        try {
            const song = await Song.findByPk(songId);
            if (!song) {
                throw new Error('Song not found');
            }

            if (tagNames.length === 0) {
                // Remove all tags
                await song.setTags([]);
                return;
            }

            // Find or create tags
            const tags = await Promise.all(
                tagNames.map(async (tagName) => {
                    const [tag] = await Tag.findOrCreate({
                        where: { name: tagName.trim() }
                    });
                    return tag;
                })
            );

            // Replace existing tags
            await song.setTags(tags);
        } catch (error) {
            throw new Error(`Failed to sync tags: ${error.message}`);
        }
    }

    /**
     * Get popular songs based on notes count
     * @param {number} limit - Number of songs to return
     * @returns {Promise<Array>} Popular songs
     */
    static async getPopularSongs(limit = 10) {
        try {
            const songs = await Song.findAll({
                include: [
                    {
                        model: Note,
                        as: 'notes',
                        attributes: []
                    },
                    {
                        model: Tag,
                        as: 'tags',
                        through: { attributes: [] }
                    }
                ],
                attributes: {
                    include: [
                        [sequelize.fn('COUNT', sequelize.col('notes.id')), 'notesCount']
                    ]
                },
                group: ['Song.id'],
                order: [[sequelize.literal('notesCount'), 'DESC']],
                limit: parseInt(limit)
            });

            return songs;
        } catch (error) {
            throw new Error(`Failed to get popular songs: ${error.message}`);
        }
    }
}

module.exports = SongService;