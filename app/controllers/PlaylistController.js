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
   * @Summary Update playlist
   * @Description Update playlist name and songs array for the authenticated user
   * @Tags Playlist
   * @Accept application/json
   * @Produce application/json
   * @Param id path string true "Playlist ID"
   * @Body {object} UpdatePlaylistRequest "Updated playlist data with songs array"
   * @Success 200 {object} PlaylistResponse "Playlist updated successfully"
   * @Failure 400 {object} BadRequestError "Invalid request body"
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
}

export default PlaylistController;
