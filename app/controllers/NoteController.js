const ErrorController = require('./ErrorController');
const Note = require('../models/Note');
const Song = require('../models/Song');

class NoteController {

    // GET /api/notes/:user_id
    static async GetNoteByUserId(req, res) {
        try {
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
            res.json({ message: 'Get All Notes', id: req.params.id, data: notes });
        } catch (error) {
            ErrorController.handleError(error, req, res);
        }
    }
}

module.exports = NoteController;