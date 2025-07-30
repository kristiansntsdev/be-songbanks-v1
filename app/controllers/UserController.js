import UserService from "../services/UserService.js";
import ErrorHandler from "../middlewares/ErrorHandler.js";
import {
  NotFoundException,
  BadRequestException,
} from "../../package/swagpress.js";

class UserController {
  /**
   * GET /api/admin/user-access
   * @Summary Get user access management data
   * @Description Retrieves a list of all users with their access status and permissions for administrative management
   * @Tags User
   * @Accept application/json
   * @Produce application/json
   * @auth
   * @Success 200 {object} UserAccessResponse "Successfully retrieved user access list"
   * @Failure 401 {object} UnauthorizedError "Unauthorized - invalid or missing token"
   * @Failure 403 {object} ForbiddenError "Forbidden - insufficient permissions"
   * @Router /api/admin/user-access [get]
   */
  static getUserAccess = ErrorHandler.asyncHandler(async (req, res) => {
    const result = await UserService.getUserAccess();

    res.json({
      code: 200,
      message: "User access list retrieved successfully",
      data: result,
    });
  });

  /**
   * PUT /api/admin/user-access/:user_id
   * @Summary Update user access status
   * @Description Updates the access status of a specific user (active/suspend) with admin privileges
   * @Tags User
   * @Accept application/json
   * @Produce application/json
   * @auth
   * @Param user_id path string true "User ID to update access status for"
   * @Param status query string true "New access status" enum:active,suspend
   * @Success 200 {object} UpdateUserAccessResponse "Successfully updated user access status"
   * @Failure 400 {object} BadRequestError "Bad request - invalid status value"
   * @Failure 401 {object} UnauthorizedError "Unauthorized - invalid or missing token"
   * @Failure 403 {object} ForbiddenError "Forbidden - insufficient admin permissions"
   * @Failure 404 {object} NotFoundError "User not found"
   * @Router /api/admin/user-access/{user_id} [put]
   */
  static updateUserAccess = ErrorHandler.asyncHandler(async (req, res) => {
    const { user_id } = req.params;
    const { status } = req.query;

    ErrorHandler.validateRequired(["status"], req.query);

    if (!["active", "suspend"].includes(status)) {
      throw new BadRequestException(
        'Invalid status. Must be either "active" or "suspend"'
      );
    }

    const result = await UserService.changeUserStatus(
      user_id,
      status,
      req.user
    );

    res.json({
      code: 200,
      message: result.message,
      data: {
        id: result.user.id,
        status: result.user.status,
      },
    });
  });

  /**
   * POST /api/users/request-vol-access
   * @Summary Request vol_user access
   * @Description Submits a request for vol_user access privileges that requires admin approval
   * @Tags User
   * @Accept application/json
   * @Produce application/json
   * @Body {object} RequestVolAccessRequest "Request body containing user ID"
   * @Success 202 {object} RequestVolAccessResponse "Access request submitted successfully"
   * @Failure 400 {object} BadRequestError "Bad request - user already has access or pending request"
   * @Failure 404 {object} NotFoundError "User not found"
   * @Router /api/users/request-vol-access [post]
   */
  static requestVolAccess = ErrorHandler.asyncHandler(async (req, res) => {
    const { user_id } = req.body;

    const result = await UserService.requestVolAccess(user_id);

    res.status(202).json({
      code: 202,
      message:
        "Vol_user access request sent successfully. Awaiting admin approval.",
      data: {
        user_id: user_id,
        status: result.status,
      },
    });
  });
}

export default UserController;
