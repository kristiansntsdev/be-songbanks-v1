package handler

import (
	"net/http"
	"sync"

	"be-songbanks-v1/api/handlers"
	"be-songbanks-v1/api/middleware"
	"be-songbanks-v1/api/platform"
	"be-songbanks-v1/api/repositories"
	"be-songbanks-v1/api/services"
	_ "github.com/go-sql-driver/mysql"
	"github.com/gofiber/adaptor/v2"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

var (
	once    sync.Once
	fapp    *fiber.App
	initErr error
)

func Handler(w http.ResponseWriter, r *http.Request) {
	once.Do(func() {
		fapp, initErr = buildApp()
	})
	if initErr != nil {
		http.Error(w, initErr.Error(), http.StatusInternalServerError)
		return
	}
	adaptor.FiberApp(fapp)(w, r)
}

func buildApp() (*fiber.App, error) {
	ctx, err := platform.NewContext()
	if err != nil {
		return nil, err
	}

	authRepo := repositories.NewAuthRepository(ctx.DB)
	tagRepo := repositories.NewTagRepository(ctx.DB)
	songRepo := repositories.NewSongRepository(ctx.DB)
	playlistRepo := repositories.NewPlaylistRepository(ctx.DB)
	teamRepo := repositories.NewTeamRepository(ctx.DB)
	userRepo := repositories.NewUserRepository(ctx.DB)

	authSvc := services.NewAuthService(authRepo, ctx.JWTSecret)
	tagSvc := services.NewTagService(tagRepo)
	songSvc := services.NewSongService(songRepo, tagRepo)
	playlistSvc := services.NewPlaylistService(playlistRepo, teamRepo, songRepo, ctx.ClientURL)
	teamSvc := services.NewTeamService(teamRepo, authRepo, playlistRepo)
	userSvc := services.NewUserService(userRepo)

	authMW := middleware.NewAuthMiddleware(authSvc)
	h := handlers.NewHandler(authMW, authSvc, songSvc, tagSvc, playlistSvc, teamSvc, userSvc)

	app := fiber.New(fiber.Config{DisableStartupMessage: true})
	app.Use(logger.New(logger.Config{
		Format: "[${time}] ${status} - ${latency} ${method} ${path} ip=${ip} ua=${ua}\n",
	}))
	h.Register(app)
	return app, nil
}
