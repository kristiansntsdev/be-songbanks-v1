import SongService from "../services/SongService.js";
import ErrorHandler from "../middlewares/ErrorHandler.js";

class ArtistController {
  /**
   * @Summary Get all artists
   * @Description Retrieve all unique artists from songs table
   * @Tags Artist
   * @Produce application/json
   * @Success 200 {object} ArtistsResponse "Artists retrieved successfully"
   * @Failure 500 {object} InternalServerError "Internal server error"
   * @Router /artists [get]
   */
  static getAllArtists = ErrorHandler.asyncHandler(async (_, res) => {
    const artists = await SongService.getAllArtists();

    res.json({
      code: 200,
      message: "Artists retrieved successfully",
      data: artists,
    });
  });
}

export default ArtistController;
