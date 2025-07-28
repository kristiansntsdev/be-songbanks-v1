import TagService from "../services/TagService.js";
import ErrorHandler from "../middlewares/ErrorHandler.js";

class TagController {
  /**
   * @Summary Get all tags with optional search
   * @Description Retrieve all available tags with optional search filtering
   * @Tags Tag
   * @Accept application/json
   * @Produce application/json
   * @Param search query string false "Optional search term to filter tags"
   * @Success 200 {object} Tag.GetTagsResponse "Tags retrieved successfully"
   * @Failure 400 {object} BadRequestError "Bad request"
   * @Router /api/tags [get]
   */
  static GetTags = ErrorHandler.asyncHandler(async (req, res) => {
    const tags = await TagService.getAllTags(req.query.search);

    res.json({
      code: 200,
      message: "Tags retrieved successfully",
      data: tags,
    });
  });

  /**
   * @Summary Create new tag (Admin only)
   * @Description Create a new tag with name and optional description
   * @Tags Tag
   * @Accept application/json
   * @Produce application/json
   * @Body {object} Tag.CreateTagRequest "Tag creation data"
   * @Success 201 {object} Tag.CreateTagResponse "Tag created successfully"
   * @Failure 400 {object} BadRequestError "Bad request - missing required fields"
   * @Failure 401 {object} UnauthorizedError "Unauthorized - admin access required"
   * @Router /api/admin/tags [post]
   * @auth
   */
  static CreateTag = ErrorHandler.asyncHandler(async (req, res) => {
    ErrorHandler.validateRequired(["name"], req.body);

    const tag = await TagService.createTag(req.body);

    res.status(201).json({
      code: 201,
      message: "Tag created successfully",
      data: {
        id: tag.id,
        name: tag.name,
      },
    });
  });
}

export default TagController;
