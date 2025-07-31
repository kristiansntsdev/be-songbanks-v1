import jwt from "jsonwebtoken";
import User from "../models/User.js";
import {
  AuthenticationException,
  AccountAccessDeniedException,
  ModelNotFoundException,
  ValidationException,
} from "../../package/swagpress.js";

class AuthService {
  static async login(username, password) {
    this.validateLoginInput(username, password);

    const user = await User.findByCredentials(username, password);

    if (!user) throw new AuthenticationException("Invalid credentials");

    this.validateUserAccess(user);

    const token = this.generateToken(user);
    const userResponse = this.sanitizeUser(user);

    return { user: userResponse, token, message: "Login successful" };
  }

  static async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.SESSION_SECRET);
      const user = await User.findById(decoded.userId, decoded.userType);

      if (!user) throw new ModelNotFoundException("User", decoded.userId);
      this.validateUserAccess(user);

      return user;
    } catch (error) {
      this.handleTokenError(error);
    }
  }

  static generateToken(user) {
    const payload = {
      userId: user.id,
      username: user.username,
      userType: user.userType,
      nama: user.nama,
    };

    return jwt.sign(payload, process.env.SESSION_SECRET, {
      expiresIn: "24h",
    });
  }

  static async refreshToken(userId, userType) {
    const user = await User.findById(userId, userType);
    if (!user) throw new ModelNotFoundException("User", userId);

    this.validateUserAccess(user);
    const token = this.generateToken(user);

    return { token, message: "Token refreshed successfully" };
  }

  static validateLoginInput(username, password) {
    if (!username) throw ValidationException.required("username");
    if (!password) throw ValidationException.required("password");
  }

  static validateUserAccess(user) {
    if (user.userType === "pengurus") {
      if (parseInt(user.leveladmin) <= 1) {
        throw new AccountAccessDeniedException(
          "Insufficient admin level access"
        );
      }
    } else if (user.userType === "peserta") {
      if (parseInt(user.userlevel) <= 2) {
        throw new AccountAccessDeniedException(
          "Insufficient user level access"
        );
      }
      if (user.verifikasi !== "1") {
        throw new AccountAccessDeniedException("Account not verified");
      }
    }
  }

  static validateUserStatus(user) {
    if (user.status !== "active") {
      throw new AccountAccessDeniedException(user.status);
    }
  }

  static validatePassword(userPassword, inputPassword) {
    if (userPassword !== inputPassword) {
      throw new AuthenticationException("Invalid credentials");
    }
  }

  static sanitizeUser(user) {
    const userResponse = { ...user };
    delete userResponse.password;
    return userResponse;
  }

  static handleTokenError(error) {
    if (error.name === "TokenExpiredError") {
      throw new AuthenticationException("Token expired");
    }
    if (error.name === "JsonWebTokenError") {
      throw new AuthenticationException("Invalid token");
    }
    throw error;
  }
}

export default AuthService;
