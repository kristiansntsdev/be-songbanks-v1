import UserService from "../services/UserService.js";
import ErrorHandler from "../middlewares/ErrorHandler.js";
import { ForbiddenException } from "../../package/swagpress.js";

class UserController {
  /**
   * GET /api/admin/user/
   * @Summary Get users with elevated privileges (Admin only)
   * @Description Retrieves a paginated and searchable list of users with userlevel > 2 (requires admin authentication)
   * @Tags User
   * @Accept application/json
   * @Produce application/json
   * @auth
   * @Param page query integer false "Page number for pagination (default: 1)"
   * @Param limit query integer false "Number of items per page (default: 10)"
   * @Param search query string false "Search term to filter by email or nama (case-insensitive partial match)"
   * @Success 200 {object} UserListResponse "Successfully retrieved user list"
   * @Failure 401 {object} UnauthorizedError "Unauthorized - invalid or missing token"
   * @Failure 403 {object} ForbiddenError "Forbidden - insufficient permissions (user level must be > 2)"
   * @Router /api/admin/user/ [get]
   */
  static getUsers = ErrorHandler.asyncHandler(async (req, res) => {
    // Check if requesting user has admin privileges (userlevel > 2)
    if (!req.user || req.user.userlevel <= 2) {
      throw new ForbiddenException(
        "Access denied. Admin privileges required (user level > 2)."
      );
    }

    const { page = 1, limit = 10, search } = req.query;

    const result = await UserService.getUsers(
      parseInt(page), 
      parseInt(limit),
      search
    );

    res.json({
      code: 200,
      message: "User list retrieved successfully",
      ...result,
    });
  });
}

export default UserController;
