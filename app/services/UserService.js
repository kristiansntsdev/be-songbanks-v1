import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Note from "../models/Note.js";
import {
  NotFoundException,
  BadRequestException,
} from "../../package/swagpress.js";

class UserService {
  static async changeUserStatus(userId, status, adminUser, userType) {
    // Validate that the requester is an admin
    await this.validateAdminPermission(adminUser);

    // Validate that the target user exists
    const targetUser = await this.validateUserExists(userId, userType);

    // Validate the status value
    this.validateUserStatus(status);

    // Note: Status updates would need to be implemented with raw SQL queries
    // This is a placeholder that would need specific implementation based on your table structure
    throw new Error(
      "Status updates not implemented for external database tables"
    );
  }

  // Helper methods
  static async validateAdminPermission(adminUser) {
    // adminUser should be the authenticated user object from JWT token
    if (!adminUser || !adminUser.isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }
    return adminUser;
  }

  static async validateUserExists(userId, userType = null) {
    if (!userType) {
      // Try to find user in both tables if userType not specified
      let user = await User.findById(userId, "pengurus");
      if (!user) {
        user = await User.findById(userId, "peserta");
      }
      if (!user) throw new NotFoundException("User not found");
      return user;
    }

    const user = await User.findById(userId, userType);
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  static async ensureUserEmailUnique(email) {
    const existing = await User.findByEmail(email);

    if (existing) {
      throw new Error("User already exists with this email");
    }
  }

  static async validateUpdatePermission(userId, requesterId, requester) {
    if (userId !== requesterId && !requester.isAdmin) {
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
    // Note: This method would need to be implemented with raw SQL queries
    // for the external database tables since they don't have status fields
    // This is a placeholder that would need specific implementation
    throw new Error(
      "User access management not implemented for external database tables"
    );
  }

  static async requestVolAccess(userId, userType) {
    const user = await this.validateUserExists(userId, userType);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Note: Access request functionality would need to be implemented with raw SQL queries
    // for the external database tables since they don't have status fields
    // This is a placeholder that would need specific implementation
    throw new Error(
      "Access request functionality not implemented for external database tables"
    );
  }
}

export default UserService;
