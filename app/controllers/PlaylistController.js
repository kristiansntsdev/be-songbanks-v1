import PlaylistService from "../services/PlaylistService.js";
import ErrorHandler from "../middlewares/ErrorHandler.js";

class PlaylistController {
  /**
   * @Summary Create new playlist
   * @Description Create a playlist for the authenticated user with optional songs
   * @Tags Playlist
   * @Accept application/json
   * @Produce application/json
   * @Body {object} CreatePlaylistRequest "Playlist data with optional songs array"
   * @Success 201 {object} PlaylistResponse "Playlist created successfully"
   * @Failure 400 {object} BadRequestError "Invalid request body"
   * @Failure 401 {object} UnauthorizedError "Authentication required"
   * @Failure 409 {object} ConflictError "Playlist name already exists"
   * @Failure 500 {object} InternalServerError "Internal server error"
   * @Router /playlists [post]
   * @auth
   */
  static createPlaylist = ErrorHandler.asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    const result = await PlaylistService.createPlaylist(userId, req.body);

    res.status(201).json({
      code: 201,
      message: "Playlist created successfully",
      data: result,
    });
  });

  /**
   * @Summary Get all playlists
   * @Description Retrieve all playlists for the authenticated user with pagination
   * @Tags Playlist
   * @Produce application/json
   * @Param page query integer false "Page number for pagination" default(1)
   * @Param limit query integer false "Number of items per page" default(10)
   * @Success 200 {object} PlaylistsResponse "List of playlists retrieved successfully"
   * @Failure 401 {object} UnauthorizedError "Authentication required"
   * @Failure 500 {object} InternalServerError "Internal server error"
   * @Router /playlists [get]
   * @auth
   */
  static getAllPlaylists = ErrorHandler.asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user.userId;

    const result = await PlaylistService.getAllPlaylists(userId, page, limit);

    res.json(result);
  });

  /**
   * @Summary Get playlist by ID
   * @Description Retrieve a specific playlist by ID. Accessible by playlist owner and team members.
   * @Tags Playlist
   * @Produce application/json
   * @Param id path string true "Playlist ID"
   * @Success 200 {object} PlaylistResponse "Playlist retrieved successfully"
   * @Failure 401 {object} UnauthorizedError "Authentication required"
   * @Failure 404 {object} NotFoundError "Playlist not found or access denied"
   * @Failure 500 {object} InternalServerError "Internal server error"
   * @Router /playlists/{id} [get]
   * @auth
   */
  static getPlaylistById = ErrorHandler.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await PlaylistService.getPlaylistById(userId, id);

    res.json({
      code: 200,
      message: "Playlist retrieved successfully",
      data: result,
    });
  });

  /**
   * @Summary Update playlist name
   * @Description Update playlist name only for the authenticated user
   * @Tags Playlist
   * @Accept application/json
   * @Produce application/json
   * @Param id path string true "Playlist ID"
   * @Body {object} UpdatePlaylistRequest "Updated playlist name"
   * @Success 200 {object} PlaylistResponse "Playlist updated successfully"
   * @Failure 400 {object} BadRequestError "playlist_name is required"
   * @Failure 401 {object} UnauthorizedError "Authentication required"
   * @Failure 403 {object} ForbiddenError "Access denied"
   * @Failure 404 {object} NotFoundError "Playlist not found"
   * @Failure 409 {object} ConflictError "Playlist name already exists"
   * @Failure 500 {object} InternalServerError "Internal server error"
   * @Router /playlists/{id} [put]
   * @auth
   */
  static updatePlaylist = ErrorHandler.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await PlaylistService.updatePlaylist(userId, id, req.body);

    res.json(result);
  });

  /**
   * @Summary Delete playlist
   * @Description Delete a playlist by ID for the authenticated user
   * @Tags Playlist
   * @Produce application/json
   * @Param id path string true "Playlist ID"
   * @Success 200 {object} BaseResponseWithData "Playlist deleted successfully"
   * @Failure 401 {object} UnauthorizedError "Authentication required"
   * @Failure 403 {object} ForbiddenError "Access denied"
   * @Failure 404 {object} NotFoundError "Playlist not found"
   * @Failure 500 {object} InternalServerError "Internal server error"
   * @Router /playlists/{id} [delete]
   * @auth
   */
  static deletePlaylist = ErrorHandler.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await PlaylistService.deletePlaylist(userId, id);

    res.json({
      code: 200,
      message: result.message,
      data: {
        id: id,
      },
    });
  });

  /**
   * @Summary Generate playlist sharelink
   * @Description Generate a shareable link for a playlist that can be used to create a playlist team
   * @Tags Playlist
   * @Produce application/json
   * @Param id path string true "Playlist ID"
   * @Success 201 {object} SharelinkResponse "Sharelink generated successfully"
   * @Failure 401 {object} UnauthorizedError "Authentication required"
   * @Failure 403 {object} ForbiddenError "Access denied"
   * @Failure 404 {object} NotFoundError "Playlist not found"
   * @Failure 500 {object} InternalServerError "Internal server error"
   * @Router /playlists/{id}/sharelink [post]
   * @auth
   */
  static generateSharelink = ErrorHandler.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await PlaylistService.generateSharelink(userId, id);

    res.status(201).json({
      code: 201,
      message: "Sharelink generated successfully",
      data: result,
    });
  });

  /**
   * @Summary Join playlist via sharelink
   * @Description Join a playlist team using a share token, with the playlist creator as team leader
   * @Tags Playlist
   * @Produce application/json
   * @Param shareToken path string true "Share token from the playlist sharelink"
   * @Success 201 {object} JoinPlaylistResponse "Successfully joined playlist team"
   * @Failure 401 {object} UnauthorizedError "Authentication required"
   * @Failure 404 {object} NotFoundError "Invalid or expired share link"
   * @Failure 409 {object} ConflictError "Playlist already has a team"
   * @Failure 500 {object} InternalServerError "Internal server error"
   * @Router /playlists/join/{shareToken} [post]
   * @auth
   */
  static joinPlaylistViaSharelink = ErrorHandler.asyncHandler(
    async (req, res) => {
      const { shareToken } = req.params;
      const userId = req.user.userId;

      const result = await PlaylistService.joinPlaylistViaSharelink(
        shareToken,
        userId
      );

      res.status(201).json({
        code: 201,
        message: result.message,
        data: result,
      });
    }
  );

  /**
   * @Summary Add song(s) to playlist
   * @Description Add single song or multiple songs to a playlist. Validates song existence and prevents duplicates.
   * @Tags Playlist
   * @Accept application/json
   * @Produce application/json
   * @Param id path string true "Playlist ID"
   * @Body {object} AddSongToPlaylistRequest "Song ID(s) to add to playlist"
   * @Success 200 {object} AddSongToPlaylistResponse "Song(s) added to playlist successfully"
   * @Failure 400 {object} BadRequestError "Invalid song ID(s) provided"
   * @Failure 401 {object} UnauthorizedError "Authentication required"
   * @Failure 404 {object} NotFoundError "Playlist not found or song(s) not found"
   * @Failure 409 {object} ConflictError "All songs are already in the playlist"
   * @Failure 500 {object} InternalServerError "Internal server error"
   * @Router /playlists/{id}/songs [post]
   * @auth
   */
  static addSongToPlaylist = ErrorHandler.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
    const { songIds } = req.body;

    const result = await PlaylistService.addSongToPlaylist(userId, id, songIds);

    res.json(result);
  });
}

export default PlaylistController;
