package middleware

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"strings"

	"github.com/MicahParks/keyfunc/v3"
	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const UserIDKey contextKey = "user_id"
const UserEmailKey contextKey = "user_email"

// AuthMiddleware verifies Supabase JWT tokens via JWKS (ES256) or HMAC (HS256).
type AuthMiddleware struct {
	jwks      keyfunc.Keyfunc
	jwtSecret []byte
}

// NewAuthMiddleware creates a middleware that verifies JWTs using Supabase's JWKS endpoint.
// It also keeps the HS256 secret as a fallback.
func NewAuthMiddleware(supabaseURL string, jwtSecret string) (*AuthMiddleware, error) {
	jwksURL := fmt.Sprintf("%s/auth/v1/.well-known/jwks.json", strings.TrimRight(supabaseURL, "/"))

	// Supabase JWKS includes both "use" and "key_ops" which fails strict validation.
	jwks, err := keyfunc.NewDefaultOverrideCtx(context.Background(), []string{jwksURL}, keyfunc.Override{
		ValidationSkipAll: true,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create JWKS keyfunc from %s: %w", jwksURL, err)
	}

	slog.Info("JWKS loaded successfully", "url", jwksURL)

	return &AuthMiddleware{
		jwks:      jwks,
		jwtSecret: []byte(jwtSecret),
	}, nil
}

// Wrap protects an http.Handler with JWT authentication.
func (m *AuthMiddleware) Wrap(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, `{"error":"missing authorization header"}`, http.StatusUnauthorized)
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			http.Error(w, `{"error":"invalid authorization format"}`, http.StatusUnauthorized)
			return
		}

		// Try JWKS first (ES256), fall back to HMAC (HS256)
		token, jwksErr := jwt.Parse(tokenString, m.jwks.KeyfuncCtx(r.Context()))
		if jwksErr != nil {
			slog.Debug("JWKS verification failed, trying HMAC fallback", "error", jwksErr)
			var hmacErr error
			token, hmacErr = jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
				}
				return m.jwtSecret, nil
			})
			if hmacErr != nil {
				slog.Warn("invalid JWT token", "jwks_error", jwksErr, "hmac_error", hmacErr)
				http.Error(w, `{"error":"invalid or expired token"}`, http.StatusUnauthorized)
				return
			}
		}

		if !token.Valid {
			slog.Warn("invalid JWT token")
			http.Error(w, `{"error":"invalid or expired token"}`, http.StatusUnauthorized)
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			http.Error(w, `{"error":"invalid token claims"}`, http.StatusUnauthorized)
			return
		}

		userID, ok := claims["sub"].(string)
		if !ok || userID == "" {
			http.Error(w, `{"error":"missing user id in token"}`, http.StatusUnauthorized)
			return
		}

		email, _ := claims["email"].(string)

		slog.Debug("authenticated user", "user_id", userID, "email", email)

		ctx := context.WithValue(r.Context(), UserIDKey, userID)
		ctx = context.WithValue(ctx, UserEmailKey, email)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// GetUserID extracts the user ID from the request context.
func GetUserID(ctx context.Context) (string, error) {
	userID, ok := ctx.Value(UserIDKey).(string)
	if !ok || userID == "" {
		return "", errors.New("user not authenticated")
	}
	return userID, nil
}

// GetUserEmail extracts the user email from the request context.
func GetUserEmail(ctx context.Context) string {
	email, _ := ctx.Value(UserEmailKey).(string)
	return email
}
