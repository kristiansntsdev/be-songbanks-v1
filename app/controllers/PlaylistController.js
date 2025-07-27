const PlaylistService = require("../services/PlaylistService");
const ErrorHandler = require("../middlewares/ErrorHandler");

class PlaylistController {
  /**
   * GET /api/playlists
   * @summary Get all playlists
   * @returns {playlists: array}
   */
  static getAllPlaylists = ErrorHandler.asyncHandler(async (req, res) => {
    const playlists = await PlaylistService.getAllPlaylists();

    res.json({
      code: 200,
      message: "List of playlists retrieved successfully",
      data: playlists,
    });
  });

  /**
   * GET /api/playlists/:id
   * @summary Get playlist by ID
   * @param {string} id - Playlist ID parameter
   * @returns {playlist: object}
   */
  static getPlaylistById = ErrorHandler.asyncHandler(async (req, res) => {
    const playlist = await PlaylistService.getPlaylistById(req.params.id);

    res.json({
      code: 200,
      message: "Playlist details retrieved successfully",
      data: playlist,
    });
  });

  /**
   * POST /api/playlists
   * @summary Create new playlist
   * @body {playlist_name: string, sharable_link: string, playlist_team_id: string}
   * @returns {playlist: object}
   */
  static createPlaylist = ErrorHandler.asyncHandler(async (req, res) => {
    const playlist = await PlaylistService.createPlaylist(
      req.body,
      req.user.id
    );

    res.status(201).json({
      code: 201,
      message: "Playlist created successfully",
      data: {
        id: playlist.id,
        playlist_name: playlist.playlist_name,
      },
    });
  });

  /**
   * PUT /api/playlists/:id
   * @summary Update playlist
   * @param {string} id - Playlist ID parameter
   * @body {playlist_name: string, sharable_link: string, playlist_team_id: string}
   * @returns {playlist: object}
   */
  static updatePlaylist = ErrorHandler.asyncHandler(async (req, res) => {
    const playlist = await PlaylistService.updatePlaylist(
      req.params.id,
      req.body,
      req.user.id
    );

    res.json({
      code: 200,
      message: "Playlist updated successfully",
      data: {
        id: playlist.id,
        playlist_name: playlist.playlist_name,
      },
    });
  });

  /**
   * DELETE /api/playlists/:id
   * @summary Delete playlist
   * @param {string} id - Playlist ID parameter
   * @returns {message: string}
   */
  static deletePlaylist = ErrorHandler.asyncHandler(async (req, res) => {
    await PlaylistService.deletePlaylist(req.params.id, req.user.id);

    res.json({
      code: 200,
      message: "Playlist deleted successfully",
      data: {
        id: req.params.id,
      },
    });
  });

  /**
   * GET /api/users/:user_id/playlists
   * @summary Get user playlists
   * @param {string} user_id - User ID parameter
   * @returns {playlists: array}
   */
  static getUserPlaylists = ErrorHandler.asyncHandler(async (req, res) => {
    const { user_id } = req.params;

    // Validate user ID matches authenticated user
    if (req.user.id !== user_id) {
      return res.status(403).json({
        code: 403,
        message: "Access denied. User ID must match authenticated user.",
      });
    }

    const playlists = await PlaylistService.getUserPlaylists(user_id);

    res.json({
      code: 200,
      message: "User playlists retrieved successfully",
      data: playlists,
    });
  });

  /**
   * POST /api/playlists/:id/songs/:song_id
   * @summary Add song to playlist
   * @param {string} id - Playlist ID parameter
   * @param {string} song_id - Song ID parameter
   * @body {order_index: number}
   * @returns {message: string}
   */
  static addSongToPlaylist = ErrorHandler.asyncHandler(async (req, res) => {
    const { id: playlistId, song_id: songId } = req.params;
    const { order_index } = req.body;

    await PlaylistService.addSongToPlaylist(
      playlistId,
      songId,
      order_index,
      req.user.id
    );

    res.status(201).json({
      code: 201,
      message: "Song added to playlist successfully",
      data: {
        playlist_id: playlistId,
        song_id: songId,
      },
    });
  });

  /**
   * DELETE /api/playlists/:id/songs/:song_id
   * @summary Remove song from playlist
   * @param {string} id - Playlist ID parameter
   * @param {string} song_id - Song ID parameter
   * @returns {message: string}
   */
  static removeSongFromPlaylist = ErrorHandler.asyncHandler(
    async (req, res) => {
      const { id: playlistId, song_id: songId } = req.params;

      await PlaylistService.removeSongFromPlaylist(
        playlistId,
        songId,
        req.user.id
      );

      res.json({
        code: 200,
        message: "Song removed from playlist successfully",
        data: {
          playlist_id: playlistId,
          song_id: songId,
        },
      });
    }
  );

  /**
   * PUT /api/playlists/:id/reorder
   * @summary Reorder playlist songs
   * @param {string} id - Playlist ID parameter
   * @body {songs: array}
   * @returns {message: string}
   */
  static reorderPlaylistSongs = ErrorHandler.asyncHandler(async (req, res) => {
    const { id: playlistId } = req.params;
    const { songs } = req.body;

    await PlaylistService.reorderPlaylistSongs(playlistId, songs, req.user.id);

    res.json({
      code: 200,
      message: "Playlist songs reordered successfully",
      data: {
        playlist_id: playlistId,
      },
    });
  });

  /**
   * POST /api/playlists/:id/share
   * @summary Generate shareable link for playlist
   * @param {string} id - Playlist ID parameter
   * @returns {sharable_link: string, team_id: string, is_shared: boolean, is_locked: boolean}
   */
  static generateShareableLink = ErrorHandler.asyncHandler(async (req, res) => {
    const { id: playlistId } = req.params;

    const result = await PlaylistService.generateShareableLink(
      playlistId,
      req.user.id
    );

    res.status(201).json({
      code: 201,
      message: "Shareable link generated successfully",
      data: result,
    });
  });

  /**
   * POST /api/playlists/join/:share_token
   * @summary Join playlist via shareable link
   * @param {string} share_token - Share token parameter
   * @returns {playlist_id: string, team_id: string, role: string, is_locked: boolean}
   */
  static joinPlaylistViaLink = ErrorHandler.asyncHandler(async (req, res) => {
    const { share_token: shareToken } = req.params;

    const result = await PlaylistService.joinPlaylistViaLink(
      shareToken,
      req.user.id
    );

    res.json({
      code: 200,
      message: "Successfully joined playlist",
      data: result,
    });
  });

  /**
   * GET /api/playlists/shared/:share_token
   * @summary Get shared playlist details (public access)
   * @param {string} share_token - Share token parameter
   * @returns {playlist: object}
   */
  static getSharedPlaylistDetails = ErrorHandler.asyncHandler(
    async (req, res) => {
      const { share_token: shareToken } = req.params;

      const playlist =
        await PlaylistService.getSharedPlaylistDetails(shareToken);

      res.json({
        code: 200,
        message: "Shared playlist details retrieved successfully",
        data: playlist,
      });
    }
  );
}

module.exports = PlaylistController;
