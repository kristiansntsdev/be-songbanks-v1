import NoteService from "../services/NoteService.js";
import ErrorHandler from "../middlewares/ErrorHandler.js";

class NoteController {
  /**
   * POST /api/notes/:user_id/:song_id
   * @summary Add note to song (Vol_User Only)
   * @param {string} user_id - User ID parameter (must match authenticated user)
   * @param {string} song_id - Song ID parameter
   * @body {notes: string}
   * @returns {note: object}
   */
  static createNoteForSong = ErrorHandler.asyncHandler(async (req, res) => {
    const { user_id, song_id } = req.params;

    if (req.user.id !== user_id) {
      return res.status(403).json({
        code: 403,
        message: "Access denied. User ID must match authenticated user.",
      });
    }

    const note = await NoteService.addNoteToSong(
      user_id,
      song_id,
      req.body.notes
    );

    res.status(201).json({
      code: 201,
      message: "Note added successfully",
      data: note,
    });
  });

  /**
   * GET /api/notes/:user_id
   * @summary Get all notes by user (Vol_User Only)
   * @param {string} user_id - User ID parameter (must match authenticated user)
   * @returns {notes: array}
   */
  static getAllUserNotes = ErrorHandler.asyncHandler(async (req, res) => {
    const { user_id } = req.params;

    if (req.user.id !== user_id) {
      return res.status(403).json({
        code: 403,
        message: "Access denied. User ID must match authenticated user.",
      });
    }

    const notes = await NoteService.getAllUserNotes(user_id);

    res.json({
      code: 200,
      message: "List of notes retrieved successfully",
      data: notes,
    });
  });

  /**
   * GET /api/notes/:user_id/:id
   * @summary Get note by ID (Vol_User Only)
   * @param {string} user_id - User ID parameter (must match authenticated user)
   * @param {string} id - Note ID parameter
   * @returns {note: object}
   */
  static getNoteById = ErrorHandler.asyncHandler(async (req, res) => {
    const { user_id, id } = req.params;

    if (req.user.id !== user_id) {
      return res.status(403).json({
        code: 403,
        message: "Access denied. User ID must match authenticated user.",
      });
    }

    const note = await NoteService.getNoteById(id, user_id);

    res.json({
      code: 200,
      message: "Note details retrieved successfully",
      data: note,
    });
  });

  /**
   * PUT /api/notes/:user_id/:id
   * @summary Update note (Vol_User Only)
   * @param {string} user_id - User ID parameter (must match authenticated user)
   * @param {string} id - Note ID parameter
   * @body {notes: string}
   * @returns {note: object}
   */
  static updateNote = ErrorHandler.asyncHandler(async (req, res) => {
    const { user_id, id } = req.params;

    if (req.user.id !== user_id) {
      return res.status(403).json({
        code: 403,
        message: "Access denied. User ID must match authenticated user.",
      });
    }

    const note = await NoteService.updateNote(id, user_id, req.body.notes);

    res.json({
      code: 200,
      message: "Note updated successfully",
      data: note,
    });
  });

  /**
   * DELETE /api/notes/:user_id/:id
   * @summary Delete note (Vol_User Only)
   * @param {string} user_id - User ID parameter (must match authenticated user)
   * @param {string} id - Note ID parameter
   * @returns {message: string}
   */
  static deleteNote = ErrorHandler.asyncHandler(async (req, res) => {
    const { user_id, id } = req.params;

    if (req.user.id !== user_id) {
      return res.status(403).json({
        code: 403,
        message: "Access denied. User ID must match authenticated user.",
      });
    }

    await NoteService.deleteNote(id, user_id);

    res.json({
      code: 200,
      message: "Note deleted successfully",
      data: {
        id: id,
      },
    });
  });
}

export default NoteController;
