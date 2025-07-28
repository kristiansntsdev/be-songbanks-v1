import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock CommonJS modules properly
vi.mock("../../app/models/User.js", () => ({
  default: {
    findByPk: vi.fn(),
    update: vi.fn(),
    query: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        first: vi.fn(),
        get: vi.fn(),
      }),
    }),
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
  },
}));

describe("UserService", () => {
  let UserService, User, bcrypt;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Import modules
    UserService = (await import("../../app/services/UserService.js")).default;
    User = (await import("../../app/models/User.js")).default;
    bcrypt = (await import("bcryptjs")).default;
  });

  describe("validateAdminPermission", () => {
    it("should validate admin user successfully", async () => {
      const adminUser = { id: "admin-id", role: "admin" };

      const result = await UserService.validateAdminPermission(adminUser);

      expect(result).toEqual(adminUser);
    });

    it("should throw error for non-admin user", async () => {
      const nonAdminUser = { id: "user-id", role: "user" };

      await expect(
        UserService.validateAdminPermission(nonAdminUser),
      ).rejects.toThrow("Unauthorized: Admin access required");
    });

    it("should throw error for null user", async () => {
      await expect(UserService.validateAdminPermission(null)).rejects.toThrow(
        "Unauthorized: Admin access required",
      );
    });
  });

  describe("validateUserStatus", () => {
    it("should validate active status", () => {
      expect(() => {
        UserService.validateUserStatus("active");
      }).not.toThrow();
    });

    it("should validate suspend status", () => {
      expect(() => {
        UserService.validateUserStatus("suspend");
      }).not.toThrow();
    });

    it("should throw error for invalid status", () => {
      expect(() => {
        UserService.validateUserStatus("invalid");
      }).toThrow('Invalid status. Must be either "active" or "suspend"');
    });
  });

  describe("validateUpdatePermission", () => {
    it("should allow user to update their own profile", async () => {
      const user = { id: "user-id", role: "user" };

      await expect(
        UserService.validateUpdatePermission("user-id", "user-id", user),
      ).resolves.not.toThrow();
    });

    it("should allow admin to update any profile", async () => {
      const adminUser = { id: "admin-id", role: "admin" };

      await expect(
        UserService.validateUpdatePermission(
          "other-user-id",
          "admin-id",
          adminUser,
        ),
      ).resolves.not.toThrow();
    });

    it("should throw error when non-admin tries to update other profile", async () => {
      const user = { id: "user-id", role: "user" };

      await expect(
        UserService.validateUpdatePermission("other-user-id", "user-id", user),
      ).rejects.toThrow("Unauthorized: Can only update your own profile");
    });
  });

  describe("buildPagination", () => {
    it("should build pagination object correctly", () => {
      const result = UserService.buildPagination(25, 2, 10);

      expect(result).toEqual({
        currentPage: 2,
        totalPages: 3,
        totalItems: 25,
        itemsPerPage: 10,
        hasNextPage: true,
        hasPrevPage: true,
      });
    });

    it("should handle first page correctly", () => {
      const result = UserService.buildPagination(25, 1, 10);

      expect(result).toEqual({
        currentPage: 1,
        totalPages: 3,
        totalItems: 25,
        itemsPerPage: 10,
        hasNextPage: true,
        hasPrevPage: false,
      });
    });
  });

  describe("paginatedResponse", () => {
    it("should return paginated response with default key", () => {
      const rows = [{ id: 1 }, { id: 2 }];
      const result = UserService.paginatedResponse(rows, 10, 1, 5);

      expect(result).toEqual({
        items: rows,
        pagination: {
          currentPage: 1,
          totalPages: 2,
          totalItems: 10,
          itemsPerPage: 5,
          hasNextPage: true,
          hasPrevPage: false,
        },
      });
    });

    it("should return paginated response with custom key", () => {
      const rows = [{ id: 1 }];
      const result = UserService.paginatedResponse(rows, 5, 2, 3, "users");

      expect(result).toEqual({
        users: rows,
        pagination: {
          currentPage: 2,
          totalPages: 2,
          totalItems: 5,
          itemsPerPage: 3,
          hasNextPage: false,
          hasPrevPage: true,
        },
      });
    });
  });
});
