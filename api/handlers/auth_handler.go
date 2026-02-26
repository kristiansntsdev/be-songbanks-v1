package handlers

import (
	"be-songbanks-v1/api/middleware"
	"be-songbanks-v1/api/utils"
	"github.com/gofiber/fiber/v2"
)

func (h *Handler) Login(c *fiber.Ctx) error {
	var req struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.BodyParser(&req); err != nil {
		return utils.Fail(c, 400, "Invalid JSON")
	}
	data, status, err := h.auth.Login(req.Username, req.Email, req.Password)
	if err != nil {
		return utils.Fail(c, status, err.Error())
	}
	return utils.OK(c, 200, "Login successful", data)
}

func (h *Handler) GetMe(c *fiber.Ctx) error {
	cl := middleware.GetClaims(c)
	return utils.OK(c, 200, "Current user retrieved successfully", fiber.Map{"user": fiber.Map{"id": cl.UserID, "userType": cl.UserType, "username": cl.Username, "userlevel": cl.UserLevel}})
}

func (h *Handler) CheckPermission(c *fiber.Ctx) error {
	cl := middleware.GetClaims(c)
	role := c.Query("role")
	if role != "" && cl.UserType != role {
		return utils.Fail(c, 403, "Access denied")
	}
	return utils.OK(c, 200, "Permission granted", fiber.Map{"hasPermission": true, "userType": cl.UserType, "isAdmin": cl.UserType == "pengurus"})
}
