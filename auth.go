package main

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"github.com/gin-gonic/gin"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

var (
	sessions = make(map[string]time.Time)
	mu       = &sync.Mutex{}
)

const tokenExpiry = 30 * 24 * time.Hour

func generateToken() (string, error) {
	b := make([]byte, 32)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

func LoginHandler(c *gin.Context) {
	var req struct {
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	adminPassword := os.Getenv("ADMIN_PASSWORD")
	if subtle.ConstantTimeCompare([]byte(req.Password), []byte(adminPassword)) != 1 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid password"})
		return
	}

	token, err := generateToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	mu.Lock()
	sessions[token] = time.Now().Add(tokenExpiry)
	mu.Unlock()

	c.JSON(http.StatusOK, gin.H{"token": token})
}

func LogoutHandler(c *gin.Context) {
	authHeader := c.GetHeader("Authorization")
	token := strings.TrimPrefix(authHeader, "Bearer ")

	mu.Lock()
	delete(sessions, token)
	mu.Unlock()

	c.JSON(http.StatusOK, gin.H{"message": "Logged out"})
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing authorization header"})
			c.Abort()
			return
		}

		token := strings.TrimPrefix(authHeader, "Bearer ")
		if token == authHeader {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization format"})
			c.Abort()
			return
		}

		mu.Lock()
		expiry, exists := sessions[token]
		mu.Unlock()

		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		if time.Now().After(expiry) {
			mu.Lock()
			delete(sessions, token)
			mu.Unlock()
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token expired"})
			c.Abort()
			return
		}

		c.Next()
	}
}
