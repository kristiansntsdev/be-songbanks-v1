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
   * @Description Retrieves a paginated list of all users with their access status and permissions for administrative management
   * @Tags User
   * @Accept application/json
   * @Produce application/json
   * @auth
   * @Param page query integer false "Page number for pagination (default: 1)"
   * @Param limit query integer false "Number of items per page (default: 10)"
   * @Success 200 {object} UserAccessResponse "Successfully retrieved user access list"
   * @Failure 401 {object} UnauthorizedError "Unauthorized - invalid or missing token"
   * @Failure 403 {object} ForbiddenError "Forbidden - insufficient permissions"
   * @Router /api/admin/user-access [get]
   */
  static getUserAccess = ErrorHandler.asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    const result = await UserService.getUserAccess(
      parseInt(page),
      parseInt(limit)
    );

    res.json({
      code: 200,
      message: "User access list retrieved successfully",
      ...result,
    });
  });

  /**
   * PUT /api/admin/user-access/:user_id
   * @Summary Update user access status
   * @Description Updates the access status of a specific user with admin privileges
   * @Tags User
   * @Accept application/json
   * @Produce application/json
   * @auth
   * @Param user_id path string true "User ID to update access status for"
   * @Param status query string true "User Status" enum:["active","suspend","request","pending"]
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

    ErrorHandler.validateRequired(["user_id"], req.params);
    ErrorHandler.validateRequired(["status"], req.query);

    if (!["active", "suspend", "request", "pending"].includes(status)) {
      throw new BadRequestException(
        'Invalid status. Must be one of: "active", "suspend", "request", "pending"'
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
      data: result.user,
    });
  });

  /**
   * PUT /api/admin/user-role/:user_id
   * @Summary Update user role
   * @Description Updates the role of a specific user with admin privileges
   * @Tags User
   * @Accept application/json
   * @Produce application/json
   * @auth
   * @Param user_id path string true "User ID to update role for"
   * @Param role query string true "User Role (guest, member, admin)" enum:["guest","member","admin"]
   * @Success 200 {object} UpdateUserAccessResponse "Successfully updated user role"
   * @Failure 400 {object} BadRequestError "Bad request - invalid role value"
   * @Failure 401 {object} UnauthorizedError "Unauthorized - invalid or missing token"
   * @Failure 403 {object} ForbiddenError "Forbidden - insufficient admin permissions"
   * @Failure 404 {object} NotFoundError "User not found"
   * @Router /api/admin/user-role/{user_id} [put]
   */
  static updateUserRole = ErrorHandler.asyncHandler(async (req, res) => {
    const { user_id } = req.params;
    const { role } = req.query;

    ErrorHandler.validateRequired(["user_id"], req.params);
    ErrorHandler.validateRequired(["role"], req.query);

    if (!["guest", "member", "admin"].includes(role)) {
      throw new BadRequestException(
        'Invalid role. Must be one of: "guest", "member", "admin"'
      );
    }

    const result = await UserService.changeUserRole(user_id, role, req.user);

    res.json({
      code: 200,
      message: result.message,
      data: result.user,
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

  /**
   * POST /api/admin/approve-vol-access
   * @Summary Approve user vol access request
   * @Description Approves a user's vol_user access request, setting status to active and role to member
   * @Tags User
   * @Accept application/json
   * @Produce application/json
   * @auth
   * @Body {object} ApproveVolAccessRequest "Request body containing user ID"
   * @Success 200 {object} UpdateUserAccessResponse "Successfully approved user access request"
   * @Failure 400 {object} BadRequestError "Bad request - user does not have pending request"
   * @Failure 401 {object} UnauthorizedError "Unauthorized - invalid or missing token"
   * @Failure 403 {object} ForbiddenError "Forbidden - insufficient admin permissions"
   * @Failure 404 {object} NotFoundError "User not found"
   * @Router /api/admin/approve-vol-access [post]
   */
  static approveVolAccess = ErrorHandler.asyncHandler(async (req, res) => {
    const { user_id } = req.body;

    ErrorHandler.validateRequired(["user_id"], req.body);

    const result = await UserService.approveUserRequest(user_id, req.user);

    res.json({
      code: 200,
      message: result.message,
      data: result.user,
    });
  });
}

export default UserController;
