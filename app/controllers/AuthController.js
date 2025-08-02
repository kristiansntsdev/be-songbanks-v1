import AuthService from "../services/AuthService.js";
import ErrorHandler from "../middlewares/ErrorHandler.js";

class AuthController {
  /**
   * POST /api/auth/login
   * @Summary User login
   * @Description Authenticate admin (pengurus) with username/password or user (peserta) with email/password
   * @Tags Auth
   * @Accept application/json
   * @Produce application/json
   * @Body {object} LoginRequest "User login credentials (username for admin, email for user)"
   * @Success 200 {object} LoginResponse "Login successful"
   * @Failure 400 {object} BadRequestError "Bad request - invalid credentials"
   * @Failure 401 {object} UnauthorizedError "Unauthorized - invalid credentials or insufficient access level"
   * @Router /api/auth/login [post]
   */
  static apiLogin = ErrorHandler.asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    const result = await AuthService.login(username, password);

    res.json({
      code: 200,
      message: result.message,
      data: {
        token: result.token,
        user: result.user,
      },
    });
  });

  /**
   * POST /api/auth/logout
   * @Summary User logout
   * @Description Logout authenticated user
   * @Tags Auth
   * @Accept application/json
   * @Produce application/json
   * @auth
   * @Success 200 {object} LogoutResponse "Logout successful"
   * @Failure 401 {object} UnauthorizedError "Unauthorized - invalid or missing token"
   * @Router /api/auth/logout [post]
   */
  static apiLogout = ErrorHandler.asyncHandler(async (req, res) => {
    res.json({
      code: 200,
      message: "Logout successful",
    });
  });

  /**
   * GET /api/auth/me
   * @Summary Get current user
   * @Description Get current authenticated user data
   * @Tags Auth
   * @Accept application/json
   * @Produce application/json
   * @auth
   * @Success 200 {object} UserResponse "Current user data"
   * @Failure 401 {object} UnauthorizedError "Unauthorized"
   * @Router /api/auth/me [get]
   */
  static apiGetCurrentUser = ErrorHandler.asyncHandler(async (req, res) => {
    res.json({
      code: 200,
      message: "Current user retrieved successfully",
      data: {
        user: req.currentUser,
      },
    });
  });

  /**
   * GET /api/auth/check-permission
   * @Summary Check user permission
   * @Description Check if current user has required role permission
   * @Tags Auth
   * @Accept application/json
   * @Produce application/json
   * @auth
   * @Query {string} role "Required role (pengurus or peserta)"
   * @Success 200 {object} PermissionResponse "Permission check result"
   * @Failure 401 {object} UnauthorizedError "Unauthorized"
   * @Failure 403 {object} ForbiddenError "Access denied"
   * @Router /api/auth/check-permission [get]
   */
  static apiCheckPermission = ErrorHandler.asyncHandler(async (req, res) => {
    const { role } = req.query;

    if (role && req.currentUser.userType !== role) {
      return res.status(403).json({
        code: 403,
        message: "Access denied",
      });
    }

    res.json({
      code: 200,
      message: "Permission granted",
      data: {
        hasPermission: true,
        userType: req.currentUser.userType,
        isAdmin: req.currentUser.userType === "pengurus",
      },
    });
  });
}

export default AuthController;
