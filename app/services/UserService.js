import User from "../models/User.js";
import {
  NotFoundException,
  BadRequestException,
} from "../../package/swagpress/index.js";

class UserService {
  static async changeUserStatus(userId, status, adminUser) {
    await this.validateAdminPermission(adminUser);

    const targetUser = await this.validateUserExists(userId);

    this.validateUserStatus(status);

    if (!["active", "suspend"].includes(status)) {
      throw new BadRequestException(
        'Invalid status. Must be either "active" or "suspend"',
      );
    }

    await User.update({ status }, { where: { id: userId } });
    targetUser.status = status;

    return {
      user: targetUser,
      message: `User status changed to ${status}`,
    };
  }

  static async validateAdminPermission(adminUser) {
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
        'Invalid status. Must be either "active" or "suspend"',
      );
    }
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
        "User already has access or has pending request",
      );
    }

    if (user.status === "suspend") {
      throw new BadRequestException(
        "User is suspended and cannot request access",
      );
    }

    await User.update({ status: "request" }, { where: { id: userId } });

    return {
      status: "request",
      message: "Access request submitted successfully",
    };
  }
}

export default UserService;
