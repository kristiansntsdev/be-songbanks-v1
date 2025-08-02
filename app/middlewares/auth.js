import jwt from "jsonwebtoken";
import {
  UnauthorizedException,
  ForbiddenException,
} from "../../package/swagpress.js";
import User from "../models/User.js";

const JWT_SECRET = process.env.SESSION_SECRET || "your-secret-key";

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      throw new UnauthorizedException("Access token required");
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return next(new UnauthorizedException("Invalid or expired token"));
      }
      req.user = user;
      next();
    });
  } catch (error) {
    next(error);
  }
};

const requireRole = (requiredRole) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedException("Authentication required");
      }

      // Always verify user data from database, never trust JWT payload
      const currentUser = await User.findById(
        req.user.userId,
        req.user.userType
      );

      if (!currentUser) {
        throw new UnauthorizedException("User not found");
      }

      // Validate user access (same as AuthService)
      if (currentUser.userType === "pengurus") {
        if (parseInt(currentUser.leveladmin) <= 1) {
          throw new ForbiddenException("Insufficient admin level access");
        }
      } else if (currentUser.userType === "peserta") {
        if (parseInt(currentUser.userlevel) <= 2) {
          throw new ForbiddenException("Insufficient user level access");
        }
        if (currentUser.verifikasi !== "1") {
          throw new ForbiddenException("Account not verified");
        }
      }

      // Check if user has required role
      if (requiredRole && currentUser.userType !== requiredRole) {
        throw new ForbiddenException(
          `Access denied. Required role: ${requiredRole}`
        );
      }

      // Attach fresh user data to request
      req.currentUser = currentUser;
      next();
    } catch (error) {
      next(error);
    }
  };
};

const requireAdmin = requireRole("pengurus");
const requirePeserta = requireRole("peserta");

export { authenticateToken, requireRole, requireAdmin, requirePeserta };
