import SongService from "../services/SongService.js";
import ErrorHandler from "../middlewares/ErrorHandler.js";

class SongController {
  /**
   * @Summary Get all songs with pagination, search, and filters
   * @Description Retrieve all songs with support for pagination, full-text search across title/artist/lyrics, filtering by base chord and tags, and custom sorting
   * @Tags Song
   * @Produce application/json
   * @Param page query integer false "Page number for pagination" default(1)
   * @Param limit query integer false "Number of items per page" default(10)
   * @Param search query string false "Search term for title, artist, or lyrics"
   * @Param base_chord query string false "Filter songs by base chord"
   * @Param tag_ids query string false "Filter by tag IDs (comma-separated)"
   * @Param sortBy query string false "Sort field" default(createdAt)
   * @Param sortOrder query string false "Sort order" enum:["ASC","DESC"] default(DESC)
   * @Success 200 {object} SongsResponse "Songs retrieved successfully"
   * @Failure 400 {object} BadRequestError "Invalid request parameters"
   * @Failure 500 {object} InternalServerError "Internal server error"
   * @Router /songs [get]
   */
  static getAllSongs = ErrorHandler.asyncHandler(async (req, res) => {
    const { page, limit, search, base_chord, tag_ids, sortBy, sortOrder } =
      req.query;

    const options = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      search,
      base_chord,
      tag_ids: tag_ids ? tag_ids.split(",") : undefined,
      sortBy: sortBy || "createdAt",
      sortOrder: sortOrder || "DESC",
    };

    const result = await SongService.getAllSongs(options);

    res.json({
      code: 200,
      message: "Songs retrieved successfully",
      data: result.songs,
      pagination: result.pagination,
    });
  });

  /**
   * @Summary Get song by ID
   * @Description Retrieve a single song with all associated tags by its ID
   * @Tags Song
   * @Produce application/json
   * @Param id path string true "Song ID"
   * @Success 200 {object} SongResponse "Song details retrieved successfully"
   * @Failure 404 {object} NotFoundError "Song not found"
   * @Failure 500 {object} InternalServerError "Internal server error"
   * @Router /songs/{id} [get]
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
   * @Summary Create new song
   * @Description Create a new song with associated tags. Tags will be found by name or created automatically if they don't exist (Admin only)
   * @Tags Song
   * @Accept application/json
   * @Produce application/json
   * @Body {object} CreateSongRequest "Song data with optional tags"
   * @Success 201 {object} SongResponse "Song created successfully"
   * @Failure 400 {object} BadRequestError "Invalid request body"
   * @Failure 401 {object} UnauthorizedError "Authentication required"
   * @Failure 403 {object} ForbiddenError "Admin access required"
   * @Failure 500 {object} InternalServerError "Internal server error"
   * @Router /admin/songs [post]
   * @auth
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
   * @Summary Update song
   * @Description Update an existing song and/or its associated tags. Tags will be found by name or created automatically if they don't exist. Include tag_names array to update tags, or omit to keep existing tags (Admin only)
   * @Tags Song
   * @Accept application/json
   * @Produce application/json
   * @Param id path string true "Song ID"
   * @Body {object} UpdateSongRequest "Updated song data with optional tags"
   * @Success 200 {object} SongResponse "Song updated successfully"
   * @Failure 400 {object} BadRequestError "Invalid request body"
   * @Failure 401 {object} UnauthorizedError "Authentication required"
   * @Failure 403 {object} ForbiddenError "Admin access required"
   * @Failure 404 {object} NotFoundError "Song not found"
   * @Failure 500 {object} InternalServerError "Internal server error"
   * @Router /admin/songs/{id} [put]
   * @auth
   */
  static updateSong = ErrorHandler.asyncHandler(async (req, res) => {
    const song = await SongService.updateSong(req.params.id, req.body);
    res.json({
      code: 200,
      message: "Song updated successfully",
      data: song,
    });
  });

  /**
   * @Summary Delete song
   * @Description Delete a song and all its associations (Admin only)
   * @Tags Song
   * @Produce application/json
   * @Param id path string true "Song ID"
   * @Success 200 {object} BaseResponseWithData "Song deleted successfully"
   * @Failure 401 {object} UnauthorizedError "Authentication required"
   * @Failure 403 {object} ForbiddenError "Admin access required"
   * @Failure 404 {object} NotFoundError "Song not found"
   * @Failure 500 {object} InternalServerError "Internal server error"
   * @Router /admin/songs/{id} [delete]
   * @auth
   */
  static deleteSong = ErrorHandler.asyncHandler(async (req, res) => {
    const result = await SongService.deleteSong(req.params.id);

    res.json({
      code: 200,
      message: result.message,
      data: {
        id: result.deletedId,
      },
    });
  });
}

export default SongController;
