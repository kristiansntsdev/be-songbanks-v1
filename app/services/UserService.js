import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Note from "../models/Note.js";
import sequelize from "../../config/database.js";
import {
  NotFoundException,
  BadRequestException,
} from "../../package/swagpress.js";

class UserService {
  static async changeUserStatus(
    userId,
    status,
    adminUser,
    userType = "peserta"
  ) {
    // Validate that the requester is an admin
    await this.validateAdminPermission(adminUser);

    // Validate that the target user exists
    const targetUser = await this.validateUserExists(userId, userType);

    // Validate the status value
    this.validateUserStatus(status);

    // Determine role based on status
    let role;
    if (status === "active") {
      role = "member";
    } else if (status === "pending" || status === "suspend") {
      role = "guest";
    } else {
      role = targetUser.role; // Keep existing role for other statuses
    }

    // Update user status and role in peserta table
    await sequelize.query(
      "UPDATE peserta SET status = ?, role = ? WHERE id_peserta = ?",
      {
        replacements: [status, role, userId],
        type: sequelize.QueryTypes.UPDATE,
      }
    );

    // Get updated user data
    const updatedUser = await this.validateUserExists(userId, userType);

    return {
      message: `User status updated to ${status} successfully`,
      user: {
        id: updatedUser.id,
        nama: updatedUser.nama,
        username: updatedUser.username,
        status: status,
        role: role,
      },
    };
  }

  // Helper methods
  static async validateAdminPermission(adminUser) {
    // adminUser should be the authenticated user object from JWT token
    if (!adminUser || adminUser.userType !== "pengurus") {
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
    if (userId !== requesterId && requester.userType !== "pengurus") {
      throw new Error("Unauthorized: Can only update your own profile");
    }
  }

  static validateUserStatus(status) {
    const validStatuses = ["active", "suspend", "request", "pending"];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(
        'Invalid status. Must be one of: "active", "suspend", "request", "pending"'
      );
    }
  }

  static validateUserRole(role) {
    const validRoles = ["guest", "member", "admin"];
    if (!validRoles.includes(role)) {
      throw new BadRequestException(
        'Invalid role. Must be one of: "guest", "member", "admin"'
      );
    }
  }

  static async changeUserRole(userId, role, adminUser, userType = "peserta") {
    // Validate that the requester is an admin
    await this.validateAdminPermission(adminUser);

    // Validate that the target user exists
    const targetUser = await this.validateUserExists(userId, userType);

    // Validate the role value
    this.validateUserRole(role);

    // Update user role in peserta table
    await sequelize.query("UPDATE peserta SET role = ? WHERE id_peserta = ?", {
      replacements: [role, userId],
      type: sequelize.QueryTypes.UPDATE,
    });

    // Get updated user data
    const updatedUser = await this.validateUserExists(userId, userType);

    return {
      message: `User role updated to ${role} successfully`,
      user: {
        id: updatedUser.id,
        nama: updatedUser.nama,
        username: updatedUser.username,
        status: updatedUser.status,
        role: role,
      },
    };
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

  static async getUserAccess(page = 1, limit = 10, status = null) {
    const offset = (page - 1) * limit;

    // Build WHERE clause for status filtering
    let whereClause = "";
    let replacements = [];

    if (status) {
      whereClause = "WHERE status = ?";
      replacements.push(status);
    }

    // Get total count with status filter
    const countQuery = `SELECT COUNT(*) as total FROM peserta ${whereClause}`;
    const countResult = await sequelize.query(countQuery, {
      replacements: replacements,
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });
    const totalCount = countResult[0].total;

    // Get paginated users with status filter
    const dataQuery = `SELECT *, "peserta" as userType FROM peserta ${whereClause} LIMIT ? OFFSET ?`;
    const dataReplacements = [...replacements, limit, offset];

    const pesertaUsers = await sequelize.query(dataQuery, {
      replacements: dataReplacements,
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });

    const allUsers = pesertaUsers.map((user) => ({
      id: user.id_peserta,
      nama: user.nama,
      username: user.email,
      status: user.status,
      role: user.role,
    }));

    return {
      data: allUsers,
      pagination: this.buildPagination(totalCount, page, limit),
    };
  }

  static async requestVolAccess(userId, userType = "peserta") {
    const user = await this.validateUserExists(userId, userType);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Check if user already has active status or pending request
    if (user.status === "active") {
      throw new BadRequestException("User already has active access");
    }

    if (user.status === "request") {
      throw new BadRequestException(
        "User already has a pending access request"
      );
    }

    // Update user status to "request" in peserta table
    await sequelize.query(
      "UPDATE peserta SET status = ? WHERE id_peserta = ?",
      {
        replacements: ["request", userId],
        type: sequelize.QueryTypes.UPDATE,
      }
    );

    return {
      message: "Vol_user access request submitted successfully",
      status: "request",
      userId: userId,
    };
  }

  static async approveUserRequest(userId, adminUser, userType = "peserta") {
    // Validate that the requester is an admin
    await this.validateAdminPermission(adminUser);

    // Validate that the target user exists
    const targetUser = await this.validateUserExists(userId, userType);

    // Check if user has a pending request
    if (targetUser.status !== "request") {
      throw new BadRequestException(
        "User does not have a pending access request"
      );
    }

    // Update user status to "active" and role to "member"
    await sequelize.query(
      "UPDATE peserta SET status = ?, role = ? WHERE id_peserta = ?",
      {
        replacements: ["active", "member", userId],
        type: sequelize.QueryTypes.UPDATE,
      }
    );

    // Get updated user data
    const updatedUser = await this.validateUserExists(userId, userType);

    return {
      message: "User access request approved successfully",
      user: {
        id: updatedUser.id,
        nama: updatedUser.nama,
        username: updatedUser.username,
        status: "active",
        role: "member",
      },
    };
  }

  static async rejectUserRequest(userId, adminUser, userType = "peserta") {
    // Validate that the requester is an admin
    await this.validateAdminPermission(adminUser);

    // Validate that the target user exists
    const targetUser = await this.validateUserExists(userId, userType);

    // Check if user has a pending request
    if (targetUser.status !== "request") {
      throw new BadRequestException(
        "User does not have a pending access request"
      );
    }

    // Update user status to "pending" and role to "guest"
    await sequelize.query(
      "UPDATE peserta SET status = ?, role = ? WHERE id_peserta = ?",
      {
        replacements: ["pending", "guest", userId],
        type: sequelize.QueryTypes.UPDATE,
      }
    );

    // Get updated user data
    const updatedUser = await this.validateUserExists(userId, userType);

    return {
      message: "User access request rejected",
      user: {
        id: updatedUser.id,
        nama: updatedUser.nama,
        username: updatedUser.username,
        status: "pending",
        role: "guest",
      },
    };
  }
}

export default UserService;
