const Note = require('../models/Note');
const Song = require('../models/Song');
const ErrorHandler = require('../middleware/ErrorHandler');

class NoteController {

    /**
     * GET /api/notes/:user_id
     * @summary Get notes by user ID
     * @param {string} user_id - User ID parameter
     * @returns {notes: array}
     */
    static GetNoteByUserId = ErrorHandler.asyncHandler(async (req, res) => {
        const notes = await Note.findAll({
            where: {
                user_id: req.params.user_id
            },
            include: [{
                model: Song,
                attributes: ['id', 'title', 'artist']
            }],
            attributes: ['id', 'notes', 'createdAt', 'updatedAt']
        });
        
        res.json({
            code: 200,
            message: 'Get All Notes',
            data: notes
        });
    });
}

module.exports = NoteController;