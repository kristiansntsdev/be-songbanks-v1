const { Op } = require('sequelize');
const Note = require('../models/Note');
const Song = require('../models/Song');
const User = require('../models/User');

class NoteService {
    /**
     * Get all notes with pagination and filters
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Paginated notes
     */
    static async getAllNotes(options = {}) {
        try {
            const {
                page = 1,
                limit = 10,
                userId,
                songId,
                search,
                sortBy = 'createdAt',
                sortOrder = 'DESC'
            } = options;

            const offset = (page - 1) * limit;
            const where = {};

            // Add user filter
            if (userId) {
                where.user_id = userId;
            }

            // Add song filter
            if (songId) {
                where.song_id = songId;
            }

            // Add search filter
            if (search) {
                where.notes = {
                    [Op.like]: `%${search}%`
                };
            }

            const { count, rows } = await Note.findAndCountAll({
                where,
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'email', 'role']
                    },
                    {
                        model: Song,
                        as: 'song',
                        attributes: ['id', 'title', 'artist']
                    }
                ],
                limit: parseInt(limit),
                offset,
                order: [[sortBy, sortOrder]]
            });

            return {
                notes: rows,
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
            throw new Error(`Failed to retrieve notes: ${error.message}`);
        }
    }

    /**
     * Get note by ID with full details
     * @param {string} noteId - Note ID
     * @returns {Promise<Object>} Note details
     */
    static async getNoteById(noteId) {
        try {
            const note = await Note.findByPk(noteId, {
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'email', 'role']
                    },
                    {
                        model: Song,
                        as: 'song',
                        attributes: ['id', 'title', 'artist', 'base_chord']
                    }
                ]
            });

            if (!note) {
                throw new Error('Note not found');
            }

            return note;
        } catch (error) {
            throw new Error(`Failed to retrieve note: ${error.message}`);
        }
    }

    /**
     * Create a new note
     * @param {Object} noteData - Note creation data
     * @param {string} userId - User ID creating the note
     * @returns {Promise<Object>} Created note
     */
    static async createNote(noteData, userId) {
        try {
            // Verify song exists
            const song = await Song.findByPk(noteData.song_id);
            if (!song) {
                throw new Error('Song not found');
            }

            // Verify user exists
            const user = await User.findByPk(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Check if user already has a note for this song
            const existingNote = await Note.findOne({
                where: {
                    user_id: userId,
                    song_id: noteData.song_id
                }
            });

            if (existingNote) {
                throw new Error('You already have a note for this song. Use update instead.');
            }

            const note = await Note.create({
                user_id: userId,
                song_id: noteData.song_id,
                notes: noteData.notes
            });

            // Return note with associations
            return await this.getNoteById(note.id);
        } catch (error) {
            throw new Error(`Failed to create note: ${error.message}`);
        }
    }

    /**
     * Update an existing note
     * @param {string} noteId - Note ID
     * @param {Object} updateData - Update data
     * @param {string} userId - User ID making the update
     * @returns {Promise<Object>} Updated note
     */
    static async updateNote(noteId, updateData, userId) {
        try {
            const note = await Note.findByPk(noteId);
            if (!note) {
                throw new Error('Note not found');
            }

            // Check ownership (users can only edit their own notes)
            if (note.user_id !== userId) {
                // Check if user is admin
                const user = await User.findByPk(userId);
                if (!user || user.role !== 'admin') {
                    throw new Error('Unauthorized: You can only edit your own notes');
                }
            }

            // Update note content
            await note.update({
                notes: updateData.notes
            });

            // Return updated note with associations
            return await this.getNoteById(noteId);
        } catch (error) {
            throw new Error(`Failed to update note: ${error.message}`);
        }
    }

    /**
     * Delete a note
     * @param {string} noteId - Note ID
     * @param {string} userId - User ID requesting deletion
     * @returns {Promise<Object>} Success message
     */
    static async deleteNote(noteId, userId) {
        try {
            const note = await Note.findByPk(noteId);
            if (!note) {
                throw new Error('Note not found');
            }

            // Check ownership (users can only delete their own notes)
            if (note.user_id !== userId) {
                // Check if user is admin
                const user = await User.findByPk(userId);
                if (!user || user.role !== 'admin') {
                    throw new Error('Unauthorized: You can only delete your own notes');
                }
            }

            await note.destroy();

            return {
                message: 'Note deleted successfully'
            };
        } catch (error) {
            throw new Error(`Failed to delete note: ${error.message}`);
        }
    }

    /**
     * Get notes for a specific song
     * @param {string} songId - Song ID
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Song notes with pagination
     */
    static async getNotesForSong(songId, options = {}) {
        try {
            const {
                page = 1,
                limit = 10,
                sortBy = 'createdAt',
                sortOrder = 'DESC'
            } = options;

            // Verify song exists
            const song = await Song.findByPk(songId);
            if (!song) {
                throw new Error('Song not found');
            }

            const offset = (page - 1) * limit;

            const { count, rows } = await Note.findAndCountAll({
                where: { song_id: songId },
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'email', 'role']
                    }
                ],
                limit: parseInt(limit),
                offset,
                order: [[sortBy, sortOrder]]
            });

            return {
                song,
                notes: rows,
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
            throw new Error(`Failed to get notes for song: ${error.message}`);
        }
    }

    /**
     * Get notes by a specific user
     * @param {string} userId - User ID
     * @param {Object} options - Query options
     * @returns {Promise<Object>} User notes with pagination
     */
    static async getNotesByUser(userId, options = {}) {
        try {
            const {
                page = 1,
                limit = 10,
                sortBy = 'createdAt',
                sortOrder = 'DESC'
            } = options;

            // Verify user exists
            const user = await User.findByPk(userId);
            if (!user) {
                throw new Error('User not found');
            }

            const offset = (page - 1) * limit;

            const { count, rows } = await Note.findAndCountAll({
                where: { user_id: userId },
                include: [
                    {
                        model: Song,
                        as: 'song',
                        attributes: ['id', 'title', 'artist', 'base_chord']
                    }
                ],
                limit: parseInt(limit),
                offset,
                order: [[sortBy, sortOrder]]
            });

            return {
                user,
                notes: rows,
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
            throw new Error(`Failed to get notes by user: ${error.message}`);
        }
    }

    /**
     * Search notes by content
     * @param {string} searchTerm - Search term
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Matching notes
     */
    static async searchNotes(searchTerm, options = {}) {
        try {
            const { userId, limit = 50 } = options;

            const where = {
                notes: {
                    [Op.like]: `%${searchTerm}%`
                }
            };

            // Filter by user if specified
            if (userId) {
                where.user_id = userId;
            }

            const notes = await Note.findAll({
                where,
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'email', 'role']
                    },
                    {
                        model: Song,
                        as: 'song',
                        attributes: ['id', 'title', 'artist']
                    }
                ],
                limit: parseInt(limit),
                order: [['createdAt', 'DESC']]
            });

            return notes;
        } catch (error) {
            throw new Error(`Failed to search notes: ${error.message}`);
        }
    }

    /**
     * Get note statistics
     * @returns {Promise<Object>} Note statistics
     */
    static async getNoteStats() {
        try {
            const totalNotes = await Note.count();
            
            const notesByUser = await Note.count({
                group: ['user_id']
            });

            const notesBySong = await Note.count({
                group: ['song_id']
            });

            const avgNotesPerUser = notesByUser.length > 0 
                ? (totalNotes / notesByUser.length).toFixed(2) 
                : 0;

            const avgNotesPerSong = notesBySong.length > 0 
                ? (totalNotes / notesBySong.length).toFixed(2) 
                : 0;

            return {
                total: totalNotes,
                uniqueUsers: notesByUser.length,
                uniqueSongs: notesBySong.length,
                averagePerUser: parseFloat(avgNotesPerUser),
                averagePerSong: parseFloat(avgNotesPerSong)
            };
        } catch (error) {
            throw new Error(`Failed to get note statistics: ${error.message}`);
        }
    }

    /**
     * Get or create note for user and song
     * @param {string} userId - User ID
     * @param {string} songId - Song ID
     * @param {string} noteContent - Note content
     * @returns {Promise<Object>} Note object
     */
    static async getOrCreateNote(userId, songId, noteContent) {
        try {
            const [note, created] = await Note.findOrCreate({
                where: {
                    user_id: userId,
                    song_id: songId
                },
                defaults: {
                    user_id: userId,
                    song_id: songId,
                    notes: noteContent
                }
            });

            // If note exists but content is different, update it
            if (!created && note.notes !== noteContent) {
                await note.update({ notes: noteContent });
            }

            // Return note with associations
            return await this.getNoteById(note.id);
        } catch (error) {
            throw new Error(`Failed to get or create note: ${error.message}`);
        }
    }

    /**
     * Bulk delete notes by user
     * @param {string} userId - User ID
     * @param {string} requesterId - User making the request
     * @returns {Promise<Object>} Deletion result
     */
    static async deleteNotesByUser(userId, requesterId) {
        try {
            // Check permissions
            if (userId !== requesterId) {
                const requester = await User.findByPk(requesterId);
                if (!requester || requester.role !== 'admin') {
                    throw new Error('Unauthorized: Admin access required');
                }
            }

            const deletedCount = await Note.destroy({
                where: { user_id: userId }
            });

            return {
                deletedCount,
                message: `Successfully deleted ${deletedCount} note(s)`
            };
        } catch (error) {
            throw new Error(`Failed to delete notes by user: ${error.message}`);
        }
    }

    /**
     * Get recent notes across the system
     * @param {number} limit - Number of notes to return
     * @returns {Promise<Array>} Recent notes
     */
    static async getRecentNotes(limit = 10) {
        try {
            const notes = await Note.findAll({
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'email', 'role']
                    },
                    {
                        model: Song,
                        as: 'song',
                        attributes: ['id', 'title', 'artist']
                    }
                ],
                limit: parseInt(limit),
                order: [['createdAt', 'DESC']]
            });

            return notes;
        } catch (error) {
            throw new Error(`Failed to get recent notes: ${error.message}`);
        }
    }
}

module.exports = NoteService;