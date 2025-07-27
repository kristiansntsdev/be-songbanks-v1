import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock CommonJS modules properly
vi.mock("../../app/models/User.js", () => ({
  default: {
    scope: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        first: vi.fn(),
      }),
    }),
    findByPk: vi.fn(),
    query: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        first: vi.fn(),
      }),
    }),
  },
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn(),
    verify: vi.fn(),
  },
}));

describe("AuthService", () => {
  let AuthService, User, jwt;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Import modules
    AuthService = (await import("../../app/services/AuthService.js")).default;
    User = (await import("../../app/models/User.js")).default;
    jwt = (await import("jsonwebtoken")).default;

    process.env.SESSION_SECRET = "test-secret";
  });

  describe("validatePassword", () => {
    it("should validate correct password", () => {
      expect(() => {
        AuthService.validatePassword("password123", "password123");
      }).not.toThrow();
    });

    it("should throw error for incorrect password", () => {
      expect(() => {
        AuthService.validatePassword("password123", "wrong-password");
      }).toThrow("Invalid credentials");
    });
  });

  describe("login", () => {
    it("should throw error for non-existent user", async () => {
      User.scope().where().first.mockResolvedValue(null);

      await expect(
        AuthService.login("nonexistent@example.com", "password123")
      ).rejects.toThrow("Invalid credentials");
    });
  });

  describe("verifyToken", () => {
    it("should throw error for invalid token", async () => {
      jwt.verify.mockImplementation(() => {
        const error = new Error("Invalid token");
        error.name = "JsonWebTokenError";
        throw error;
      });

      await expect(AuthService.verifyToken("invalid-token")).rejects.toThrow(
        "Invalid token"
      );
    });
  });

  describe("refreshToken", () => {
    it("should throw error for non-existent user", async () => {
      User.findByPk.mockResolvedValue(null);

      await expect(AuthService.refreshToken("non-existent-id")).rejects.toThrow(
        "User with ID non-existent-id not found"
      );
    });
  });
});
