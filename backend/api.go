package main

import (
	"context"
	"net/http"
	"os"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func getCORSConfig() cors.Config {
	LoadRootEnv()
	allowedOrigins := os.Getenv("ALLOWED_ORIGINS")
	origins := strings.Split(allowedOrigins, ",")
	for i := range origins {
		origins[i] = strings.TrimSpace(origins[i])
	}

	corsConfig := cors.Config{
		AllowOrigins:     origins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type", "Content-Length", "Accept-Encoding", "X-CSRF-Token", "Authorization", "Accept", "Origin", "Cache-Control", "X-Requested-With"},
		AllowCredentials: true,
	}
	return corsConfig
}

func setupRouter() *gin.Engine {
	r := gin.Default()

	corsConfig := getCORSConfig()
	r.Use(cors.New(corsConfig))

	DB, err := LoadDB(context.Background())
	if err != nil {
		panic(err)
	}
	env := NewHandlerEnv(DB)
	// Ping test
	r.GET("/ping", func(c *gin.Context) {
		c.String(http.StatusOK, "pong")
	})

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"Status": "Okay"})
	})

	r.POST("/admin/login", LoginHandler)
	r.POST("/admin/logout", AuthMiddleware(), LogoutHandler)

	// books handlers
	bookHandler := NewContent[Book](env, "books")
	r.GET("/books", bookHandler.GetAll())
	r.GET("/books/:id", bookHandler.GetByID())
	r.POST("/books", AuthMiddleware(), bookHandler.Create())
	r.DELETE("/books/:id", AuthMiddleware(), bookHandler.Delete())
	r.PATCH("/books/:id", AuthMiddleware(), bookHandler.Update())
	r.PATCH("/books/:id/status", AuthMiddleware(), bookHandler.ChangeStatus())

	r.GET("/search/books", AuthMiddleware(), SearchBooksHandler(NewBookSearcher()))

	// movies handlers
	movieHandler := NewContent[Movie](env, "movies")
	r.GET("/movies", movieHandler.GetAll())
	r.GET("/movies/:id", movieHandler.GetByID())
	r.POST("/movies", AuthMiddleware(), movieHandler.Create())
	r.DELETE("/movies/:id", AuthMiddleware(), movieHandler.Delete())
	r.PATCH("/movies/:id", AuthMiddleware(), movieHandler.Update())
	r.PATCH("/movies/:id/status", AuthMiddleware(), movieHandler.ChangeStatus())

	// shows handlers
	showHandler := NewContent[Show](env, "shows")
	r.GET("/shows", showHandler.GetAll())
	r.GET("/shows/:id", showHandler.GetByID())
	r.POST("/shows", AuthMiddleware(), showHandler.Create())
	r.DELETE("/shows/:id", AuthMiddleware(), showHandler.Delete())
	r.PATCH("/shows/:id", AuthMiddleware(), showHandler.Update())
	r.PATCH("/shows/:id/status", AuthMiddleware(), showHandler.ChangeStatus())

	// API root health check (frontend served separately)
	r.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "books-movies-api"})
	})

	return r
}
