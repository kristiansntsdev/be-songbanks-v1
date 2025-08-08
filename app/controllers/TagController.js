import TagService from "../services/TagService.js";
import ErrorHandler from "../middlewares/ErrorHandler.js";

class TagController {
  /**
   * @Summary Get all tags
   * @Description Retrieve all available tags with search support
   * @Tags Tag
   * @Produce application/json
   * @Param search query string false "Search term for tag names"
   * @Success 200 {object} TagsResponse "Tags retrieved successfully"
   * @Failure 400 {object} BadRequestError "Bad request"
   * @Failure 500 {object} InternalServerError "Internal server error"
   * @Router /tags [get]
   */
  static GetTags = ErrorHandler.asyncHandler(async (req, res) => {
    const result = await TagService.getAllTags(req.query);

    res.json({
      code: 200,
      message: "Tags retrieved successfully",
      data: result,
    });
  });

  /**
   * @Summary Get or create tag
   * @Description Gets existing tag by name or creates a new one if it doesn't exist
   * @Tags Tag
   * @Accept application/json
   * @Produce application/json
   * @Body {object} GetOrCreateTagRequest "Request body with tag name"
   * @Success 200 {object} TagResponse "Tag retrieved or created successfully"
   * @Failure 400 {object} BadRequestError "Invalid request body"
   * @Failure 500 {object} InternalServerError "Internal server error"
   * @Router /tags/get-or-create [post]
   */
  static GetOrCreateTag = ErrorHandler.asyncHandler(async (req, res) => {
    ErrorHandler.validateRequired(["name"], req.body);

    const result = await TagService.getOrCreateTag(req.body);

    res.json({
      code: 200,
      message: result.created
        ? "Tag created successfully"
        : "Tag retrieved successfully",
      data: result,
    });
  });
}

export default TagController;
