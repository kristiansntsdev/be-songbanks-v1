import SongService from "../services/SongService.js";
import ErrorHandler from "../middlewares/ErrorHandler.js";

class SongController {
  /**
   * GET /api/songs
   * @summary Get all songs
   * @returns {songs: array}
   */
  static getAllSongs = ErrorHandler.asyncHandler(async (req, res) => {
    const songs = await SongService.getAllSongs();

    res.json({
      code: 200,
      message: "List of songs retrieved successfully",
      data: songs,
    });
  });

  /**
   * GET /api/songs/:id
   * @summary Get song by ID
   * @param {string} id - Song ID parameter
   * @returns {song: object}
   */
  static getSongById = ErrorHandler.asyncHandler(async (req, res) => {
    const song = await SongService.getSongById(req.params.id);

    res.json({
      code: 200,
      message: "Song details retrieved successfully",
      data: song,
    });
  });

  /**
   * POST /api/admin/songs
   * @summary Create new song (Admin Only)
   * @body {title: string, artist: string, tag_ids: array, base_chord: string, lyrics_and_chords: string}
   * @returns {song: object}
   */
  static createSong = ErrorHandler.asyncHandler(async (req, res) => {
    const song = await SongService.createSong(req.body);

    res.status(201).json({
      code: 201,
      message: "Song created successfully",
      data: {
        id: song.id,
        title: song.title,
      },
    });
  });

  /**
   * PUT /api/admin/songs/:id
   * @summary Update song (Admin Only)
   * @param {string} id - Song ID parameter
   * @body {title: string, artist: string, tag_ids: array, base_chord: string, lyrics_and_chords: string}
   * @returns {song: object}
   */
  static updateSong = ErrorHandler.asyncHandler(async (req, res) => {
    const song = await SongService.updateSong(req.params.id, req.body);

    res.json({
      code: 200,
      message: "Song updated successfully",
      data: {
        id: song.id,
        title: song.title,
      },
    });
  });

  /**
   * DELETE /api/admin/songs/:id
   * @summary Delete song (Admin Only)
   * @param {string} id - Song ID parameter
   * @returns {message: string}
   */
  static deleteSong = ErrorHandler.asyncHandler(async (req, res) => {
    await SongService.deleteSong(req.params.id);

    res.json({
      code: 200,
      message: "Song deleted successfully",
      data: {
        id: req.params.id,
      },
    });
  });

  /**
   * POST /api/admin/songs/:song_id/tags/:tag_id
   * @summary Add tag to song (Admin Only)
   * @param {string} song_id - Song ID parameter
   * @param {string} tag_id - Tag ID parameter
   * @returns {message: string}
   */
  static addTagToSong = ErrorHandler.asyncHandler(async (req, res) => {
    await SongService.addTagToSong(req.params.song_id, req.params.tag_id);

    res.status(201).json({
      code: 201,
      message: "Tag added to song successfully",
      data: {
        song_id: req.params.song_id,
        tag_id: req.params.tag_id,
      },
    });
  });

  /**
   * DELETE /api/admin/songs/:song_id/tags/:tag_id
   * @summary Remove tag from song (Admin Only)
   * @param {string} song_id - Song ID parameter
   * @param {string} tag_id - Tag ID parameter
   * @returns {message: string}
   */
  static removeTagFromSong = ErrorHandler.asyncHandler(async (req, res) => {
    await SongService.removeTagFromSong(req.params.song_id, req.params.tag_id);

    res.json({
      code: 200,
      message: "Tag removed from song successfully",
      data: {
        song_id: req.params.song_id,
        tag_id: req.params.tag_id,
      },
    });
  });
}

export default SongController;
