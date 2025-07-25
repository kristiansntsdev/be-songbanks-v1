const NoteService = require('../services/NoteService');
const ErrorHandler = require('../middlewares/ErrorHandler');

class NoteController {

    /**
     * GET /api/notes
     * @summary Get all notes with pagination and filters
     * @returns {notes: array, pagination: object}
     */
    static getAllNotes = ErrorHandler.asyncHandler(async (req, res) => {
        const result = await NoteService.getAllNotes(req.query);
        
        res.json({
            code: 200,
            message: 'Notes retrieved successfully',
            data: result
        });
    });

    /**
     * GET /api/notes/:id
     * @summary Get note by ID
     * @param {string} id - Note ID parameter
     * @returns {note: object}
     */
    static getNoteById = ErrorHandler.asyncHandler(async (req, res) => {
        const note = await NoteService.getNoteById(req.params.id);
        
        res.json({
            code: 200,
            message: 'Note retrieved successfully',
            data: note
        });
    });

    /**
     * GET /api/notes/user/:user_id
     * @summary Get notes by user ID
     * @param {string} user_id - User ID parameter
     * @returns {notes: array, pagination: object}
     */
    static getNotesByUser = ErrorHandler.asyncHandler(async (req, res) => {
        const result = await NoteService.getNotesByUser(req.params.user_id, req.query);
        
        res.json({
            code: 200,
            message: 'User notes retrieved successfully',
            data: result
        });
    });

    /**
     * GET /api/notes/song/:song_id
     * @summary Get notes for a song
     * @param {string} song_id - Song ID parameter
     * @returns {notes: array, pagination: object}
     */
    static getNotesForSong = ErrorHandler.asyncHandler(async (req, res) => {
        const result = await NoteService.getNotesForSong(req.params.song_id, req.query);
        
        res.json({
            code: 200,
            message: 'Song notes retrieved successfully',
            data: result
        });
    });

    /**
     * POST /api/notes
     * @summary Create a new note
     * @body {song_id: string, notes: string}
     * @returns {note: object}
     */
    static createNote = ErrorHandler.asyncHandler(async (req, res) => {
        const note = await NoteService.createNote(req.body, req.user.id);
        
        res.status(201).json({
            code: 201,
            message: 'Note created successfully',
            data: note
        });
    });

    /**
     * PUT /api/notes/:id
     * @summary Update a note
     * @param {string} id - Note ID parameter
     * @body {notes: string}
     * @returns {note: object}
     */
    static updateNote = ErrorHandler.asyncHandler(async (req, res) => {
        const note = await NoteService.updateNote(req.params.id, req.body, req.user.id);
        
        res.json({
            code: 200,
            message: 'Note updated successfully',
            data: note
        });
    });

    /**
     * DELETE /api/notes/:id
     * @summary Delete a note
     * @param {string} id - Note ID parameter
     * @returns {message: string}
     */
    static deleteNote = ErrorHandler.asyncHandler(async (req, res) => {
        const result = await NoteService.deleteNote(req.params.id, req.user.id);
        
        res.json({
            code: 200,
            message: result.message
        });
    });

    /**
     * GET /api/notes/search
     * @summary Search notes
     * @query {string} q - Search term
     * @returns {notes: array}
     */
    static searchNotes = ErrorHandler.asyncHandler(async (req, res) => {
        const notes = await NoteService.searchNotes(req.query.q, req.query);
        
        res.json({
            code: 200,
            message: 'Notes search completed',
            data: notes
        });
    });

    /**
     * GET /api/notes/stats
     * @summary Get note statistics
     * @returns {stats: object}
     */
    static getNoteStats = ErrorHandler.asyncHandler(async (req, res) => {
        const stats = await NoteService.getNoteStats();
        
        res.json({
            code: 200,
            message: 'Note statistics retrieved',
            data: stats
        });
    });

    /**
     * GET /api/notes/recent
     * @summary Get recent notes
     * @query {number} limit - Number of notes to return
     * @returns {notes: array}
     */
    static getRecentNotes = ErrorHandler.asyncHandler(async (req, res) => {
        const notes = await NoteService.getRecentNotes(req.query.limit);
        
        res.json({
            code: 200,
            message: 'Recent notes retrieved',
            data: notes
        });
    });
}

module.exports = NoteController;