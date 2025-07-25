const { Op } = require('sequelize');
const Note = require('../models/Note');
const Song = require('../models/Song');
const User = require('../models/User');

class NoteService {
    static async getAllNotes(options = {}) {
        const { page = 1, limit = 10, userId, songId, search, sortBy = 'createdAt', sortOrder = 'DESC' } = options;

        const query = Note.query()
            .with(['user:id,email,role', 'song:id,title,artist'])
            .when(userId, q => q.where('user_id', userId))
            .when(songId, q => q.where('song_id', songId))
            .when(search, q => q.where('notes', 'like', `%${search}%`))
            .orderBy(sortBy, sortOrder)
            .paginate(page, limit);

        const { count, rows } = await query;
        return this.paginatedResponse(rows, count, page, limit);
    }

    static async getNoteById(noteId) {
        const note = await Note.query()
            .with(['user:id,email,role', 'song:id,title,artist,base_chord'])
            .findByPk(noteId);
            
        if (!note) throw new Error('Note not found');
        return note;
    }

    static async createNote(noteData, userId) {
        await this.validateSongExists(noteData.song_id);
        await this.validateUserExists(userId);
        await this.ensureUniqueUserSongNote(userId, noteData.song_id);

        const note = await Note.create({
            user_id: userId,
            song_id: noteData.song_id,
            notes: noteData.notes
        });

        return this.getNoteById(note.id);
    }

    static async updateNote(noteId, updateData, userId) {
        const note = await Note.findByPk(noteId);
        if (!note) throw new Error('Note not found');
        
        await this.validateNoteOwnership(note, userId);
        await note.update({ notes: updateData.notes });
        
        return this.getNoteById(noteId);
    }

    static async deleteNote(noteId, userId) {
        const note = await Note.findByPk(noteId);
        if (!note) throw new Error('Note not found');
        
        await this.validateNoteOwnership(note, userId);
        await note.destroy();
        
        return { message: 'Note deleted successfully' };
    }

    static async getNotesForSong(songId, options = {}) {
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = options;
        
        const song = await this.validateSongExists(songId);
        const { count, rows } = await Note.query()
            .where('song_id', songId)
            .with('user:id,email,role')
            .orderBy(sortBy, sortOrder)
            .paginate(page, limit);

        return {
            song,
            notes: rows,
            pagination: this.buildPagination(count, page, limit)
        };
    }

    static async getNotesByUser(userId, options = {}) {
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = options;
        
        const user = await this.validateUserExists(userId);
        const { count, rows } = await Note.query()
            .where('user_id', userId)
            .with('song:id,title,artist,base_chord')
            .orderBy(sortBy, sortOrder)
            .paginate(page, limit);

        return {
            user,
            notes: rows,
            pagination: this.buildPagination(count, page, limit)
        };
    }

    static async searchNotes(searchTerm, options = {}) {
        const { userId, limit = 50 } = options;

        return Note.query()
            .search(searchTerm, ['notes'])
            .when(userId, q => q.where('user_id', userId))
            .with(['user:id,email,role', 'song:id,title,artist'])
            .limit(limit)
            .latest();
    }

    static async getNoteStats() {
        const [totalNotes, uniqueUsers, uniqueSongs] = await Promise.all([
            Note.query().count(),
            Note.query().countDistinct('user_id'),
            Note.query().countDistinct('song_id')
        ]);

        return {
            total: totalNotes,
            uniqueUsers,
            uniqueSongs,
            averagePerUser: uniqueUsers ? +(totalNotes / uniqueUsers).toFixed(2) : 0,
            averagePerSong: uniqueSongs ? +(totalNotes / uniqueSongs).toFixed(2) : 0
        };
    }

    static async getOrCreateNote(userId, songId, noteContent) {
        const { instance: note, created } = await Note.firstOrCreate(
            { user_id: userId, song_id: songId },
            { user_id: userId, song_id: songId, notes: noteContent }
        );

        if (!created && note.notes !== noteContent) {
            await note.update({ notes: noteContent });
        }

        return this.getNoteById(note.id);
    }

    static async deleteNotesByUser(userId, requesterId) {
        await this.validateBulkDeletePermission(userId, requesterId);
        
        const deletedCount = await Note.query()
            .where('user_id', userId)
            .delete();

        return {
            deletedCount,
            message: `Successfully deleted ${deletedCount} note(s)`
        };
    }

    static async getRecentNotes(limit = 10) {
        return Note.query()
            .with(['user:id,email,role', 'song:id,title,artist'])
            .limit(limit)
            .latest();
    }

    static async validateSongExists(songId) {
        const song = await Song.findByPk(songId);
        if (!song) throw new Error('Song not found');
        return song;
    }

    static async validateUserExists(userId) {
        const user = await User.findByPk(userId);
        if (!user) throw new Error('User not found');
        return user;
    }

    static async ensureUniqueUserSongNote(userId, songId) {
        const existing = await Note.query()
            .where('user_id', userId)
            .where('song_id', songId)
            .first();
        
        if (existing) {
            throw new Error('You already have a note for this song. Use update instead.');
        }
    }

    static async validateNoteOwnership(note, userId) {
        if (note.user_id !== userId) {
            const user = await User.findByPk(userId);
            if (!user || user.role !== 'admin') {
                throw new Error('Unauthorized: You can only edit your own notes');
            }
        }
    }

    static async validateBulkDeletePermission(userId, requesterId) {
        if (userId !== requesterId) {
            const requester = await User.findByPk(requesterId);
            if (!requester || requester.role !== 'admin') {
                throw new Error('Unauthorized: Admin access required');
            }
        }
    }

    static paginatedResponse(rows, count, page, limit) {
        return {
            notes: rows,
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

module.exports = NoteService;