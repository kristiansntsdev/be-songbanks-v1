import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Note from "../models/Note.js";
import {
  NotFoundException,
  BadRequestException,
} from "../../package/swagpress.js";

class UserService {
  static async changeUserStatus(userId, status, adminUser) {
    // Validate that the requester is an admin
    await this.validateAdminPermission(adminUser);

    // Validate that the target user exists
    const targetUser = await this.validateUserExists(userId);

    // Validate the status value
    this.validateUserStatus(status);

    // Update the target user's status
    await User.update({ status }, { where: { id: userId } });

    // Return the updated user data
    targetUser.status = status; // Update the local object to reflect the change

    return {
      user: targetUser,
      message: `User status changed to ${status}`,
    };
  }

  // Helper methods
  static async validateAdminPermission(adminUser) {
    // adminUser should be the authenticated user object from JWT token
    if (!adminUser || adminUser.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }
    return adminUser;
  }

  static async validateUserExists(userId) {
    const user = await User.findByPk(userId);
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  static async ensureUserEmailUnique(email) {
    const existing = await User.query().where("email", email).first();

    if (existing) {
      throw new Error("User already exists with this email");
    }
  }

  static async validateUpdatePermission(userId, requesterId, requester) {
    if (userId !== requesterId && requester.role !== "admin") {
      throw new Error("Unauthorized: Can only update your own profile");
    }
  }

  static validateUserStatus(status) {
    const validStatuses = ["active", "suspend"];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(
        'Invalid status. Must be either "active" or "suspend"'
      );
    }
  }

  static async hashPassword(password) {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  static paginatedResponse(rows, count, page, limit, key = "items") {
    return {
      [key]: rows,
      pagination: this.buildPagination(count, page, limit),
    };
  }

  static buildPagination(count, page, limit) {
    return {
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      totalItems: count,
      itemsPerPage: parseInt(limit),
      hasNextPage: page * limit < count,
      hasPrevPage: page > 1,
    };
  }

  static async getUserAccess() {
    const [activeUsers, requestUsers, suspendedUsers] = await Promise.all([
      User.query().where("status", "active").get(),
      User.query().where("status", "request").get(),
      User.query().where("status", "suspend").get(),
    ]);

    return {
      active_users: activeUsers
        .filter((user) => user.role !== "admin")
        .map((user) => ({
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
        })),
      request_users: requestUsers.map((user) => ({
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
      })),
      suspended_users: suspendedUsers.map((user) => ({
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
      })),
    };
  }

  static async requestVolAccess(userId) {
    const user = await this.validateUserExists(userId);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.status === "active" || user.status === "request") {
      throw new BadRequestException(
        "User already has access or has pending request"
      );
    }

    if (user.status === "suspend") {
      throw new BadRequestException(
        "User is suspended and cannot request access"
      );
    }

    // Update user status to request using direct database update
    await User.update({ status: "request" }, { where: { id: userId } });

    return {
      status: "request",
      message: "Access request submitted successfully",
    };
  }
}

export default UserService;
