import AuthService from "../services/AuthService.js";
import ErrorHandler from "../middlewares/ErrorHandler.js";

class AuthController {
  /**
   * @Summary User login
   * @Description Authenticate user with email and password
   * @Tags Auth
   * @Accept application/json
   * @Produce application/json
   * @Body {object} Auth.LoginRequest "User login credentials"
   * @Success 200 {object} Auth.LoginResponse "Login successful"
   * @Failure 400 {object} BadRequestError "Bad request - invalid credentials"
   * @Failure 401 {object} UnauthorizedError "Unauthorized - invalid email or password"
   * @Router /api/auth/login [post]
   */
  static apiLogin = ErrorHandler.asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);

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
   * @Summary User logout
   * @Description Logout authenticated user
   * @Tags Auth
   * @Accept application/json
   * @Produce application/json
   * @auth
   * @Success 200 {object} Auth.LogoutResponse "Logout successful"
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
   * @Summary Verify JWT token
   * @Description Verify the validity of a JWT token and return user information
   * @Tags Auth
   * @Accept application/json
   * @Produce application/json
   * @Body {object} Auth.VerifyTokenRequest "Token to verify"
   * @Success 200 {object} Auth.VerifyTokenResponse "Token verified successfully"
   * @Failure 400 {object} BadRequestError "Bad request - invalid token format"
   * @Failure 401 {object} UnauthorizedError "Unauthorized - invalid or expired token"
   * @Router /api/auth/verify [post]
   */
  static apiVerifyToken = ErrorHandler.asyncHandler(async (req, res) => {
    const { token } = req.body;
    const user = await AuthService.verifyToken(token);

    res.json({
      code: 200,
      message: "Token verified successfully",
      data: { user },
    });
  });

  /**
   * @Summary Refresh JWT token
   * @Description Generate a new JWT token for authenticated user
   * @Tags Auth
   * @Accept application/json
   * @Produce application/json
   * @auth
   * @Success 200 {object} Auth.RefreshTokenResponse "Token refreshed successfully"
   * @Failure 401 {object} UnauthorizedError "Unauthorized - invalid or missing token"
   * @Router /api/auth/refresh [post]
   */
  static apiRefreshToken = ErrorHandler.asyncHandler(async (req, res) => {
    const result = await AuthService.refreshToken(req.user.id);

    res.json({
      code: 200,
      message: result.message,
      data: { token: result.token },
    });
  });
}

export default AuthController;
